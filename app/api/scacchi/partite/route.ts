import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listaPartite, salvaPartita } from '@/lib/scacchi/db';

export async function GET(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const q = req.nextUrl.searchParams;
  const esito = q.get('esito');
  const partite = await listaPartite({
    esito: esito === 'vinta' || esito === 'persa' || esito === 'patta' ? esito : undefined,
    apertura: q.get('apertura') ?? undefined,
    limite: Math.min(Number(q.get('limite') ?? 50), 200),
    offset: Number(q.get('offset') ?? 0),
  });
  return NextResponse.json({ partite });
}

// Nuova partita: PGN incollato o partita contro il bot.
export async function POST(req: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const pgn = typeof body.pgn === 'string' ? body.pgn.trim() : '';
  if (!pgn) return NextResponse.json({ error: 'PGN mancante' }, { status: 400 });
  const colore = body.coloreMio === 'w' || body.coloreMio === 'b' ? body.coloreMio : null;
  try {
    const id = await salvaPartita({
      fonte: body.fonte === 'bot' ? 'bot' : 'pgn',
      pgn,
      coloreMio: colore,
      cadenza: body.fonte === 'bot' ? 'bot' : null,
    });
    if (!id) return NextResponse.json({ error: 'Partita già presente' }, { status: 409 });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'PGN non valido' }, { status: 400 });
  }
}
