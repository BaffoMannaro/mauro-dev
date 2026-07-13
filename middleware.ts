import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Subdominio dedicato al gestionale e dominio pubblico. Configurabili via env.
const APP_HOST = process.env.APP_HOST || 'app.maurodev.it';
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'maurodev.it';

// Le pagine del gestionale vivono fisicamente sotto /preventivi, ma sul
// subdominio (e in generale su ogni host che non è quello pubblico) vengono
// servite a URL puliti: app.maurodev.it/clienti -> /preventivi/clienti.
function stripPrefix(pathname: string) {
  const clean = pathname.replace(/^\/preventivi/, '');
  return clean === '' ? '/' : clean;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const host = (req.headers.get('host') || '').toLowerCase();
  const path = nextUrl.pathname;

  const isPublicHost = host === PUBLIC_HOST || host === `www.${PUBLIC_HOST}`;
  const isPreventiviPath = path === '/preventivi' || path.startsWith('/preventivi/');

  // --- Dominio pubblico (maurodev.it) -------------------------------------
  // Landing e pagine preventivo pubbliche (/p/...) restano qui. I vecchi link
  // al gestionale rimbalzano al subdominio, già in forma "pulita".
  if (isPublicHost) {
    if (isPreventiviPath) {
      const url = new URL(nextUrl);
      url.protocol = 'https:';
      url.host = APP_HOST;
      url.port = '';
      url.pathname = stripPrefix(path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- App del gestionale (app.maurodev.it, preview, localhost) ------------
  // Lasciamo passare API, login e pagine pubbliche preventivo senza riscrittura.
  if (path.startsWith('/api') || path === '/login' || path.startsWith('/p/')) {
    return NextResponse.next();
  }

  // Canonicalizza gli URL con prefisso al loro equivalente pulito (evita doppioni).
  if (isPreventiviPath) {
    return NextResponse.redirect(new URL(stripPrefix(path), nextUrl));
  }

  // Tutto il resto è area riservata: richiede login.
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Riscrittura interna: URL pulito -> percorso reale sotto /preventivi.
  const url = nextUrl.clone();
  url.pathname = path === '/' ? '/preventivi' : `/preventivi${path}`;
  return NextResponse.rewrite(url);
});

export const config = {
  // Gira su tutto tranne gli asset statici e i file interni di Next
  // (esclude anche i percorsi con estensione, es. /Logo.svg, /icon.png).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
