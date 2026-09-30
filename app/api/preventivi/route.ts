import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { inserisciPreventivo } from '@/lib/preventivi';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const preventivi = await sql`SELECT * FROM preventivi ORDER BY created_at DESC`;
  return NextResponse.json(preventivi);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const preventivo = await inserisciPreventivo(await req.json());
  return NextResponse.json(preventivo);
}
