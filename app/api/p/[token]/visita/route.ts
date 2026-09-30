import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { auth } from '@/lib/auth';
import { descriviUA, ensureVisiteSchema, isBot } from '@/lib/visite';

// Eventi di visita inviati dalla pagina pubblica del preventivo:
// inizio · sezione (aperta) · pdf (scaricato) · fine (tempo attivo sulla pagina).
// Inviato anche con navigator.sendBeacon, quindi il corpo può arrivare come text/plain.

const ok = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const ua = req.headers.get('user-agent') ?? '';
  if (isBot(ua)) return ok();

  // Le aperture di Mauro non contano: flag impostato dal gestionale sul dominio .maurodev.it,
  // oppure sessione admin sullo stesso host (in locale).
  if (req.cookies.get('md_interno')?.value === '1') return ok();

  let b: { evento?: string; visita_id?: string; sezione?: string; durata_ms?: number; referrer?: string };
  try {
    b = JSON.parse(await req.text());
  } catch {
    return ok();
  }
  const visitaId = typeof b.visita_id === 'string' && /^[\w-]{8,64}$/.test(b.visita_id) ? b.visita_id : null;
  if (!visitaId) return ok();

  const { token } = await params;
  await ensureVisiteSchema();

  if (b.evento === 'inizio') {
    if (await auth()) return ok();
    const [p] = await sql`SELECT id FROM preventivi WHERE token = ${token}`;
    if (!p) return ok();
    const { dispositivo, browser, sistema } = descriviUA(ua);
    const citta = req.headers.get('x-vercel-ip-city');
    await sql`
      INSERT INTO preventivi_visite (preventivo_id, visita_id, dispositivo, browser, sistema, citta, paese, referrer)
      VALUES (
        ${p.id}, ${visitaId}, ${dispositivo}, ${browser}, ${sistema},
        ${citta ? decodeURIComponent(citta) : null}, ${req.headers.get('x-vercel-ip-country')},
        ${typeof b.referrer === 'string' && b.referrer ? b.referrer.slice(0, 200) : null}
      )
      ON CONFLICT (visita_id) DO NOTHING
    `;
    return ok();
  }

  // Gli altri eventi aggiornano solo una visita già registrata per questo preventivo.
  const filtro = sql`visita_id = ${visitaId} AND preventivo_id = (SELECT id FROM preventivi WHERE token = ${token})`;

  if (b.evento === 'sezione' && typeof b.sezione === 'string') {
    const sezione = b.sezione.slice(0, 80);
    await sql`
      UPDATE preventivi_visite SET
        sezioni = CASE WHEN ${sezione} = ANY(sezioni) THEN sezioni ELSE array_append(sezioni, ${sezione}) END,
        ultima_at = NOW()
      WHERE ${filtro}
    `;
  } else if (b.evento === 'pdf') {
    await sql`UPDATE preventivi_visite SET pdf = true, ultima_at = NOW() WHERE ${filtro}`;
  } else if (b.evento === 'fine' && typeof b.durata_ms === 'number') {
    // Tempo attivo (pagina visibile), limitato a 2 ore per visita.
    const s = Math.min(7200, Math.max(0, Math.round(b.durata_ms / 1000)));
    await sql`UPDATE preventivi_visite SET durata_s = GREATEST(durata_s, ${s}), ultima_at = NOW() WHERE ${filtro}`;
  }
  return ok();
}
