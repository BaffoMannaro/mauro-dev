import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registraFinale } from '@/lib/scacchi/finali-db';

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string' || typeof body.riuscito !== 'boolean' || !Number.isInteger(body.mosse)) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }
  try {
    await registraFinale(body.id, body.riuscito, body.mosse);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
