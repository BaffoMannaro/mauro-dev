import { NextRequest, NextResponse, after } from 'next/server';
import { notificaRichiestaTardiva, registraRichiestaTardiva } from '@/lib/tardiva';

// Il cliente chiede di accettare un preventivo scaduto: salva la richiesta e avvisa Mauro via email.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await req.json().catch(() => ({}));
  const { nome, cognome, email, messaggio } = b as Record<string, string | undefined>;
  if (!nome?.trim() || !cognome?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email?.trim() ?? '')) {
    return NextResponse.json({ error: 'Nome, cognome ed email validi sono obbligatori' }, { status: 400 });
  }

  const esito = await registraRichiestaTardiva(token, {
    nome,
    cognome,
    email: email!,
    messaggio: typeof messaggio === 'string' ? messaggio : null,
    ip: req.headers.get('x-forwarded-for'),
    ua: req.headers.get('user-agent'),
  });
  if (!esito.ok) return NextResponse.json({ error: esito.errore }, { status: esito.status });

  if (!esito.gia_inviata) after(() => notificaRichiestaTardiva(token));
  return NextResponse.json({ ok: true });
}
