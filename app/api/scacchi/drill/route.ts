import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registraRipasso } from '@/lib/scacchi/missioni';

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const errori = Number(body.errori);
  if (typeof body.linea !== 'string' || !Number.isInteger(errori) || errori < 0) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }
  try {
    return NextResponse.json(await registraRipasso(body.linea, errori));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
