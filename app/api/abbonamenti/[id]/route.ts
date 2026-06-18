import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const [ab] = await sql`
    UPDATE abbonamenti SET
      nome = COALESCE(${body.nome ?? null}, nome),
      cifra = COALESCE(${body.cifra ?? null}, cifra),
      cadenza = COALESCE(${body.cadenza ?? null}, cadenza),
      data_inizio = COALESCE(${body.data_inizio ?? null}, data_inizio),
      data_fine = COALESCE(${body.data_fine ?? null}, data_fine),
      attivo = COALESCE(${body.attivo ?? null}, attivo),
      note = COALESCE(${body.note ?? null}, note)
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(ab);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM abbonamenti WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
