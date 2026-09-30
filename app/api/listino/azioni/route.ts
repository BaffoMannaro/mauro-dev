import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { creaAzione } from '@/lib/listino-db';

// Crea un'azione del listino (tipo di lavoro), es. "Landing page".
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  try {
    return NextResponse.json(await creaAzione(await req.json()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
