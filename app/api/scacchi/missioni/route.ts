import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { attivaProssima, chiudiMissione } from '@/lib/scacchi/missioni';
import { accettaProposta } from '@/lib/scacchi/bilancio';

// { azione: 'attiva_prossima' } oppure { azione: 'chiudi', id, stato: 'completata' | 'annullata' }
export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.azione === 'attiva_prossima') return NextResponse.json({ id: await attivaProssima() });
    if (body.azione === 'accetta_proposta') return NextResponse.json({ id: await accettaProposta() });
    if (body.azione === 'chiudi' && Number.isInteger(body.id) && (body.stato === 'completata' || body.stato === 'annullata')) {
      await chiudiMissione(body.id, body.stato);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
