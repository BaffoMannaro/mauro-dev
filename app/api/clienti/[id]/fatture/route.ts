import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ErrorePagamento, impostaStatoFattura } from '@/lib/fattura/server';
import { ensureFattureXmlSchema } from '@/lib/schema';

// Gestione fatture di un cliente (lato admin).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensureFattureXmlSchema();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  const [nuova] = await sql`
    INSERT INTO fatture (cliente_id, preventivo_id, numero, importo, data, stato, pdf_url, note)
    VALUES (
      ${id},
      ${b.preventivo_id || null},
      ${b.numero || null},
      ${b.importo != null && b.importo !== '' ? b.importo : null},
      ${b.data || null},
      'da_pagare',
      ${b.pdf_url || null},
      ${b.note || null}
    )
    RETURNING id
  `;
  // "Pagata" alla creazione = un pagamento pari al totale (stato e pagata_il derivano dai pagamenti).
  if (b.stato === 'pagata') {
    try {
      await impostaStatoFattura(nuova.id, 'pagata', b.pagata_il || b.data || null);
    } catch (e) {
      if (e instanceof ErrorePagamento) return NextResponse.json({ error: `Fattura salvata, ma: ${e.message}` }, { status: 400 });
      throw e;
    }
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensureFattureXmlSchema();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (!b.fattura_id) {
    return NextResponse.json({ error: 'fattura_id mancante' }, { status: 400 });
  }
  // Per ora l'unico update utile dal gestionale è lo stato pagamento (con il giorno dell'incasso).
  const [propria] = await sql`SELECT id FROM fatture WHERE id = ${b.fattura_id} AND cliente_id = ${id}`;
  if (!propria) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
  try {
    await impostaStatoFattura(b.fattura_id, b.stato === 'pagata' ? 'pagata' : 'da_pagare', b.pagata_il);
  } catch (e) {
    if (e instanceof ErrorePagamento) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensureFattureXmlSchema();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (!b.fattura_id) {
    return NextResponse.json({ error: 'fattura_id mancante' }, { status: 400 });
  }
  await sql`DELETE FROM fatture WHERE id = ${b.fattura_id} AND cliente_id = ${id}`;
  return NextResponse.json({ ok: true });
}
