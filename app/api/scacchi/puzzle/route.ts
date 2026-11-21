import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registraTentativo } from '@/lib/scacchi/puzzle';

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!Number.isInteger(body.id) || typeof body.risolto !== 'boolean') return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  try {
    return NextResponse.json(await registraTentativo(body.id, body.risolto));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
