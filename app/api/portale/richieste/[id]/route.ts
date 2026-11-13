import { NextRequest, NextResponse, after } from 'next/server';
import { clienteDallaRichiesta } from '@/lib/portale-session';
import { decidiRichiesta, ErroreCanone } from '@/lib/canone';
import { notificaDecisione } from '@/lib/canone-email';

// Il cliente approva o rifiuta la stima di una richiesta.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cid = await clienteDallaRichiesta(req);
  if (!cid) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const { id } = await params;
  const { azione } = await req.json().catch(() => ({}));
  if (azione !== 'approva' && azione !== 'rifiuta') {
    return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
  }
  try {
    const r = await decidiRichiesta(cid, Number(id), azione);
    after(() => notificaDecisione(cid, r));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ErroreCanone) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
