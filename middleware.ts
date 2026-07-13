import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Subdominio dedicato al gestionale. Tutto è configurabile via env così non
// c'è nessun host cablato nel codice.
const APP_HOST = process.env.APP_HOST || 'app.maurodev.it';
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'maurodev.it';

// Interruttore generale: finché è spento il comportamento è identico a prima
// (il gestionale resta accessibile su qualsiasi host). Si accende solo quando
// DNS + dominio Vercel + redirect Google sono pronti.
const SUBDOMAIN_ENABLED = process.env.ENABLE_APP_SUBDOMAIN === 'true';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isAdminRoute = nextUrl.pathname.startsWith('/preventivi');

  if (SUBDOMAIN_ENABLED) {
    const host = (req.headers.get('host') || '').toLowerCase();

    // Sul subdominio (app.maurodev.it) vive il gestionale.
    if (host === APP_HOST) {
      // La root del subdominio porta dritti al gestionale, non alla landing.
      if (nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/preventivi', nextUrl));
      }
      // Area riservata: se non loggato → login (sullo stesso subdominio).
      if (isAdminRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', nextUrl));
      }
      return NextResponse.next();
    }

    // Sul dominio pubblico i vecchi link al gestionale rimbalzano al subdominio.
    // Solo per l'host pubblico reale: preview Vercel e localhost restano
    // testabili così come sono.
    if (host === PUBLIC_HOST && isAdminRoute) {
      const url = new URL(nextUrl);
      url.protocol = 'https:';
      url.host = APP_HOST;
      url.port = '';
      return NextResponse.redirect(url);
    }
  }

  // Default (flag spento, preview, localhost): comportamento storico.
  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ['/', '/preventivi/:path*'],
};
