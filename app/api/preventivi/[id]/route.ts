import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { stato } = body;

  const [preventivo] = await sql`
    UPDATE preventivi
    SET stato = ${stato}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(preventivo);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM preventivi WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}