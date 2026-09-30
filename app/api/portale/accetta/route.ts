import { NextRequest, NextResponse, after } from 'next/server';
import { inviaEmailAccettazione } from '@/lib/email-accettazione';
import sql from '@/lib/db';
import { isScaduto } from '@/lib/scadenza';
import { ensurePortaleSchema } from '@/lib/schema';
import { clienteDallaRichiesta } from '@/lib/portale-session';

export async function POST(req: NextRequest) {
  const cid = await clienteDallaRichiesta(req);
  if (!cid) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensurePortaleSchema();
  const { preventivo_id } = await req.json().catch(() => ({}));
  if (!preventivo_id) {
    return NextResponse.json({ error: 'preventivo_id mancante' }, { status: 400 });
  }

  const [p] = await sql`SELECT id, stato, cliente_id, scadenza, created_at FROM preventivi WHERE id = ${preventivo_id}`;
  if (!p || p.cliente_id !== cid) {
    return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
  }
  if (p.stato !== 'inviato') {
    return NextResponse.json({ error: 'Preventivo già processato' }, { status: 400 });
  }
  if (isScaduto(p)) {
    return NextResponse.json({ error: 'Il preventivo è scaduto: aprilo per chiedere un’accettazione tardiva.' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';
  const [cliente] = await sql`SELECT nome, email FROM clienti WHERE id = ${cid}`;

  await sql`
    UPDATE preventivi
    SET stato = 'accettato',
        accettato_at = NOW(),
        accettato_ip = ${ip},
        accettato_ua = ${ua},
        accettato_nome = ${cliente?.nome || null},
        accettato_email = ${cliente?.email || null},
        updated_at = NOW()
    WHERE id = ${preventivo_id}
  `;
  after(() => inviaEmailAccettazione(Number(preventivo_id)));
  return NextResponse.json({ ok: true });
}
