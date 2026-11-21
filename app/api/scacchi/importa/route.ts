import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { elencoArchivi, importaArchivi, importaChesscom, segnaSincronizzato } from '@/lib/scacchi/chesscom';

export const maxDuration = 60;

// {} o { username }: import incrementale.
// { azione: 'elenco' }: archivi mensili per l'import completo.
// { azione: 'blocco', archivi: [...] }: importa un blocco di archivi.
// { azione: 'fine', ultimo }: segna lo storico come sincronizzato.
export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.azione === 'elenco') return NextResponse.json(await elencoArchivi());
    if (body.azione === 'blocco' && Array.isArray(body.archivi) && body.archivi.length <= 6) {
      const { username } = await elencoArchivi();
      return NextResponse.json(await importaArchivi(username, body.archivi.map(String)));
    }
    if (body.azione === 'fine' && typeof body.ultimo === 'string') {
      const { username, archivi } = await elencoArchivi();
      if (archivi.includes(body.ultimo)) await segnaSincronizzato(username, body.ultimo);
      return NextResponse.json({ ok: true });
    }
    const esito = await importaChesscom({ username: typeof body.username === 'string' ? body.username : undefined });
    return NextResponse.json(esito);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
