import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const abbonamenti = await sql`SELECT * FROM abbonamenti ORDER BY created_at DESC`;
  return NextResponse.json(abbonamenti);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json();
  const [ab] = await sql`
    INSERT INTO abbonamenti (nome, cifra, cadenza, data_inizio, data_fine, attivo, note)
    VALUES (${body.nome}, ${body.cifra}, ${body.cadenza}, ${body.data_inizio}, ${body.data_fine || null}, ${body.attivo !== false}, ${body.note || null})
    RETURNING *
  `;
  return NextResponse.json(ab);
}
