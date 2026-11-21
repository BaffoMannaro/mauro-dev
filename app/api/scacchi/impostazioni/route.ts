import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { leggiImpostazioni, salvaImpostazioni } from '@/lib/scacchi/db';
import { setValido } from '@/lib/scacchi/pezzi';

export async function GET() {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  return NextResponse.json(await leggiImpostazioni());
}

export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() || null : undefined;
  const pezzi = setValido(body.pezzi) ? body.pezzi : undefined;
  return NextResponse.json(await salvaImpostazioni({ ...(username !== undefined ? { username } : {}), ...(pezzi ? { pezzi } : {}) }));
}
