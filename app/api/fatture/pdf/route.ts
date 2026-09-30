import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseFattura } from '@/lib/fattura/parse';
import { rispostaPdf } from '@/lib/fattura/server';

// Anteprima non salvata: riceve l'XML FatturaPA (testo) e restituisce il PDF brandizzato.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  let fattura;
  try {
    fattura = parseFattura(await req.text());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  return rispostaPdf(fattura, req.nextUrl.searchParams.get('logo') !== '0');
}
