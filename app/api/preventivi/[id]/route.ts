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

  const fields: string[] = [];
  const values: any[] = [];

  const updated = await sql`
    UPDATE preventivi
    SET
      stato = COALESCE(${body.stato ?? null}, stato),
      tranches_stato = COALESCE(${body.tranches_stato ? JSON.stringify(body.tranches_stato) : null}::jsonb, tranches_stato),
      lavoro_inizio = COALESCE(${body.lavoro_inizio ?? null}, lavoro_inizio),
      lavoro_fine = COALESCE(${body.lavoro_fine ?? null}, lavoro_fine),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  return NextResponse.json(updated[0]);
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
