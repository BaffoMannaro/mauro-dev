import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { collegaPreventivo, impostaStatoFattura, preparaArchivio, sincronizzaPreventivo } from '@/lib/fattura/server';

// Aggiorna stato pagamento (con il giorno dell'incasso), preferenza logo e/o preventivo collegato di una fattura in archivio.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await preparaArchivio();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  if (b.stato !== undefined) {
    await impostaStatoFattura(id, b.stato === 'pagata' ? 'pagata' : 'da_pagare', b.pagata_il);
  }
  if (b.con_logo !== undefined) {
    await sql`UPDATE fatture SET con_logo = ${b.con_logo !== false}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (b.preventivo_id !== undefined) {
    try {
      await collegaPreventivo(Number(id), b.preventivo_id === null ? null : Number(b.preventivo_id));
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  const [eliminata] = await sql`DELETE FROM fatture WHERE id = ${id} RETURNING preventivo_id`;
  if (eliminata?.preventivo_id) await sincronizzaPreventivo(eliminata.preventivo_id);
  return NextResponse.json({ ok: true });
}
