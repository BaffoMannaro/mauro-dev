import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';

// Tre host, una sola app:
//  - PUBLIC_HOST  (maurodev.it)      -> sito pubblico + pagine preventivo /p/...
//  - APP_HOST     (app.maurodev.it)  -> gestionale admin (Google, solo Mauro)
//  - CLIENT_HOST  (area.maurodev.it) -> portale cliente (magic link)
const APP_HOST = process.env.APP_HOST || 'app.maurodev.it';
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'maurodev.it';
const CLIENT_HOST = process.env.CLIENT_HOST || 'area.maurodev.it';

// Le pagine del gestionale vivono fisicamente sotto /preventivi ma vengono
// servite a URL puliti sul subdominio admin.
function stripPrefix(pathname: string) {
  const clean = pathname.replace(/^\/preventivi/, '');
  return clean === '' ? '/' : clean;
}

// Percorsi che appartengono SOLO al portale cliente.
function isClientOnly(path: string) {
  return path === '/portale' || path === '/entra' || path === '/accedi';
}

export default auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const host = (req.headers.get('host') || '').toLowerCase();
  const path = nextUrl.pathname;

  const isPublicHost = host === PUBLIC_HOST || host === `www.${PUBLIC_HOST}`;
  const isPreventiviPath = path === '/preventivi' || path.startsWith('/preventivi/');

  // --- Portale cliente (area.maurodev.it) ---------------------------------
  if (host === CLIENT_HOST) {
    // Consumo magic link, pagina di accesso e API passano senza gate.
    if (path === '/entra' || path === '/accedi' || path.startsWith('/api/')) {
      return NextResponse.next();
    }
    // Gate sessione cliente.
    const token = req.cookies.get(CLIENT_COOKIE)?.value;
    const session = token ? await verifyClientToken(token) : null;
    if (!session || session.scope !== 'session') {
      return NextResponse.redirect(new URL('/accedi', nextUrl));
    }
    // La dashboard vive alla URL reale /portale (nessun rewrite): tutto il
    // resto viene canonicalizzato lì con un redirect sullo stesso host.
    if (path === '/portale') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/portale', nextUrl));
  }

  // --- Dominio pubblico (maurodev.it) -------------------------------------
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

  // --- App del gestionale (app.maurodev.it, preview, localhost) -----------
  // Difesa: i percorsi del portale non appartengono a questo host. Se ci
  // finiscono (magari per una cache o un link errato) li mando al portale
  // invece di rimbalzarli sul login admin (evita loop).
  if (isClientOnly(path)) {
    const url = new URL(nextUrl);
    url.protocol = 'https:';
    url.host = CLIENT_HOST;
    url.port = '';
    return NextResponse.redirect(url);
  }
  if (path.startsWith('/api') || path === '/login' || path.startsWith('/p/')) {
    return NextResponse.next();
  }
  if (isPreventiviPath) {
    return NextResponse.redirect(new URL(stripPrefix(path), nextUrl));
  }
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }
  const url = nextUrl.clone();
  url.pathname = path === '/' ? '/preventivi' : `/preventivi${path}`;
  return NextResponse.rewrite(url);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
