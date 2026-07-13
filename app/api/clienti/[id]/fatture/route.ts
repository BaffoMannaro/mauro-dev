import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensurePortaleSchema } from '@/lib/schema';

// Gestione fatture di un cliente (lato admin).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensurePortaleSchema();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  await sql`
    INSERT INTO fatture (cliente_id, preventivo_id, numero, importo, data, stato, pdf_url, note)
    VALUES (
      ${id},
      ${b.preventivo_id || null},
      ${b.numero || null},
      ${b.importo != null && b.importo !== '' ? b.importo : null},
      ${b.data || null},
      ${b.stato === 'pagata' ? 'pagata' : 'da_pagare'},
      ${b.pdf_url || null},
      ${b.note || null}
    )
  `;
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensurePortaleSchema();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (!b.fattura_id) {
    return NextResponse.json({ error: 'fattura_id mancante' }, { status: 400 });
  }
  // Per ora l'unico update utile dal gestionale è lo stato pagamento.
  await sql`
    UPDATE fatture
    SET stato = ${b.stato === 'pagata' ? 'pagata' : 'da_pagare'}, updated_at = NOW()
    WHERE id = ${b.fattura_id} AND cliente_id = ${id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensurePortaleSchema();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (!b.fattura_id) {
    return NextResponse.json({ error: 'fattura_id mancante' }, { status: 400 });
  }
  await sql`DELETE FROM fatture WHERE id = ${b.fattura_id} AND cliente_id = ${id}`;
  return NextResponse.json({ ok: true });
}
