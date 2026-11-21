import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { importaChesscom } from '@/lib/scacchi/chesscom';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const esito = await importaChesscom({ username: typeof body.username === 'string' ? body.username : undefined });
    return NextResponse.json(esito);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
