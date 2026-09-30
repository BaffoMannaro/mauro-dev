import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  ADMIN_EMAIL,
  creaCodice,
  issuer,
  redirectAmmesso,
  verificaClientId,
  type RichiestaAutorizzazione,
} from '@/lib/mcp/oauth';

// Authorization endpoint: login Google del gestionale + schermata di consenso esplicito.

type Esito = { ok: true; r: RichiestaAutorizzazione; state: string | null } | { ok: false; msg: string };

async function leggiRichiesta(p: URLSearchParams): Promise<Esito> {
  const clientId = p.get('client_id');
  const redirectUri = p.get('redirect_uri');
  const codeChallenge = p.get('code_challenge');
  if (!clientId || !redirectUri) return { ok: false, msg: 'client_id o redirect_uri mancanti.' };
  if (!redirectAmmesso(redirectUri)) return { ok: false, msg: 'redirect_uri non ammesso.' };
  if (!(await verificaClientId(clientId, redirectUri))) return { ok: false, msg: 'Client non riconosciuto.' };
  if (p.get('response_type') !== 'code') return { ok: false, msg: 'response_type non supportato.' };
  if (!codeChallenge || p.get('code_challenge_method') !== 'S256') return { ok: false, msg: 'PKCE S256 obbligatorio.' };
  return {
    ok: true,
    r: { clientId, redirectUri, codeChallenge, resource: p.get('resource') ?? undefined },
    state: p.get('state'),
  };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function pagina(titolo: string, corpo: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titolo)}</title>
<style>
  :root { --bg:#17181A; --surface:#1F2024; --edge:#34363B; --text:#F4F5EF; --muted:#B4B6AD; --accent:#DCF23C; --on-accent:#1B1D12; }
  @media (prefers-color-scheme: light) { :root { --bg:#EAE9E2; --surface:#FBFBF7; --edge:#D3D2C7; --text:#1B1C18; --muted:#4C4D45; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:16px;
         background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,sans-serif; }
  .card { background:var(--surface); border:1px solid var(--edge); border-radius:16px; padding:32px; max-width:420px; width:100%; }
  h1 { font-size:20px; margin:0 0 8px; }
  p { color:var(--muted); font-size:14px; line-height:1.5; margin:0 0 12px; }
  ul { color:var(--muted); font-size:14px; line-height:1.7; padding-left:18px; margin:0 0 20px; }
  code { color:var(--text); }
  .row { display:flex; gap:8px; }
  button { flex:1; padding:12px; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; border:1px solid var(--edge); background:transparent; color:var(--text); }
  button.ok { background:var(--accent); color:var(--on-accent); border-color:var(--accent); }
</style></head><body><div class="card">${corpo}</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' } }
  );
}

const errore = (msg: string) => (console.warn('[oauth] authorize rifiutato:', msg), pagina('Autorizzazione non valida', `<h1>Autorizzazione non valida</h1><p>${esc(msg)}</p>`, 400));

export async function GET(req: NextRequest) {
  const esito = await leggiRichiesta(req.nextUrl.searchParams);
  if (!esito.ok) return errore(esito.msg);

  const session = await auth();
  if (!session) {
    const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, req.url));
  }
  if (session.user?.email !== ADMIN_EMAIL) return errore('Account non autorizzato.');

  const hidden = [...req.nextUrl.searchParams.entries()]
    .filter(([k]) => k !== 'decisione')
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join('');
  const host = new URL(esito.r.redirectUri).host;

  return pagina(
    'Collega Claude',
    `<h1>Collegare Claude al gestionale?</h1>
     <p><code>${esc(host)}</code> chiede di accedere come <strong>${esc(session.user.email)}</strong>. Potrà:</p>
     <ul>
       <li>leggere, creare e modificare i preventivi</li>
       <li>importare, salvare e scaricare le fatture</li>
       <li>leggere statistiche e clienti</li>
     </ul>
     <form method="post">${hidden}
       <div class="row">
         <button type="submit" name="decisione" value="no">Annulla</button>
         <button type="submit" name="decisione" value="si" class="ok">Consenti</button>
       </div>
     </form>`
  );
}

export async function POST(req: NextRequest) {
  // Il consenso deve partire da questa pagina (no POST cross-site).
  const origin = req.headers.get('origin');
  if (origin && origin !== issuer(req) && origin !== req.nextUrl.origin) return errore('Origine non valida.');

  const form = new URLSearchParams(await req.text());
  const esito = await leggiRichiesta(form);
  if (!esito.ok) return errore(esito.msg);

  const session = await auth();
  if (!session || session.user?.email !== ADMIN_EMAIL) return errore('Sessione scaduta: riprova il collegamento.');

  const dest = new URL(esito.r.redirectUri);
  if (esito.state) dest.searchParams.set('state', esito.state);

  if (form.get('decisione') !== 'si') {
    dest.searchParams.set('error', 'access_denied');
  } else {
    dest.searchParams.set('code', await creaCodice(esito.r, session.user.email));
  }
  console.log('[oauth] consenso', form.get('decisione'), 'client', esito.r.clientId, '→', dest.host);
  return NextResponse.redirect(dest, 303);
}
