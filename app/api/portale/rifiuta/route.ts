import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
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

  const [p] = await sql`SELECT id, stato, cliente_id FROM preventivi WHERE id = ${preventivo_id}`;
  if (!p || p.cliente_id !== cid) {
    return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
  }
  if (p.stato !== 'inviato') {
    return NextResponse.json({ error: 'Preventivo già processato' }, { status: 400 });
  }

  await sql`
    UPDATE preventivi
    SET stato = 'rifiutato', rifiutato_at = NOW(), updated_at = NOW()
    WHERE id = ${preventivo_id}
  `;
  return NextResponse.json({ ok: true });
}
