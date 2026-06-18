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
      nome = ${body.nome},
      cifra = ${body.cifra},
      cadenza = ${body.cadenza},
      data_inizio = ${body.data_inizio},
      data_fine = ${body.data_fine || null},
      attivo = ${body.attivo},
      note = ${body.note || null},
      tag = ${body.tag || null}
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