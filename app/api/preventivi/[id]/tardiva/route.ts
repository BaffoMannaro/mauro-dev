import { NextRequest, NextResponse, after } from 'next/server';
import { auth } from '@/lib/auth';
import { gestisciRichiestaTardiva } from '@/lib/tardiva';

// Decisione di Mauro su una richiesta di accettazione tardiva: approva · riapri · rifiuta.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const { azione } = await req.json().catch(() => ({}));
  if (!['approva', 'riapri', 'rifiuta'].includes(azione)) {
    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  }
  try {
    const p = await gestisciRichiestaTardiva(Number(id), azione, (fn) => after(fn));
    return NextResponse.json(p);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
