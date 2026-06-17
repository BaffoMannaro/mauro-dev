import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';

// PATCH — aggiorna stato preventivo (solo admin)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  const { stato } = body;

  const [preventivo] = await sql`
    UPDATE preventivi
    SET stato = ${stato}, updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;

  return NextResponse.json(preventivo);
}

// DELETE — elimina preventivo (solo admin)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await sql`DELETE FROM preventivi WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
