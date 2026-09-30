import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensureFattureXmlSchema } from '@/lib/schema';

// Aggiorna stato pagamento e/o preferenza logo di una fattura in archivio.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensureFattureXmlSchema();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));

  if (b.stato !== undefined) {
    await sql`
      UPDATE fatture SET stato = ${b.stato === 'pagata' ? 'pagata' : 'da_pagare'}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
  if (b.con_logo !== undefined) {
    await sql`UPDATE fatture SET con_logo = ${b.con_logo !== false}, updated_at = NOW() WHERE id = ${id}`;
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
  await sql`DELETE FROM fatture WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
