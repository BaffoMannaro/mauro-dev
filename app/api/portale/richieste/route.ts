import { NextRequest, NextResponse, after } from 'next/server';
import { clienteDallaRichiesta } from '@/lib/portale-session';
import { ErroreCanone, leggiCanone, nuovaRichiesta } from '@/lib/canone';
import { notificaNuovaRichiesta } from '@/lib/canone-email';

// Nuova richiesta dal cliente (pagina /canone). Facoltativa: mail e messaggi restano validi.
export async function POST(req: NextRequest) {
  const cid = await clienteDallaRichiesta(req);
  if (!cid) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  if (!(await leggiCanone(cid))) return NextResponse.json({ error: 'Non disponibile' }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  try {
    const r = await nuovaRichiesta(cid, { testo: String(b.testo ?? ''), sito: b.sito ? String(b.sito) : null, urgente: !!b.urgente });
    after(() => notificaNuovaRichiesta(cid, r));
    return NextResponse.json({ ok: true, id: r.id });
  } catch (e) {
    if (e instanceof ErroreCanone) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
