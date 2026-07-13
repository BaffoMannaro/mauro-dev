import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ensurePortaleSchema } from '@/lib/schema';
import {
  verifyClientToken,
  createSessionToken,
  CLIENT_COOKIE,
} from '@/lib/client-auth';

// Consuma il magic link (?token=...): verifica, apre la sessione cliente e
// reindirizza alla dashboard.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const payload = token ? await verifyClientToken(token) : null;

  if (!payload || payload.scope !== 'magic') {
    return NextResponse.redirect(new URL('/accedi?errore=link', req.nextUrl));
  }

  await ensurePortaleSchema();
  const [cliente] = await sql`SELECT id FROM clienti WHERE id = ${payload.cid}`;
  if (!cliente) {
    return NextResponse.redirect(new URL('/accedi?errore=link', req.nextUrl));
  }
  await sql`UPDATE clienti SET ultimo_accesso_portale = NOW() WHERE id = ${payload.cid}`;

  const session = await createSessionToken(payload.cid);
  const res = NextResponse.redirect(new URL('/', req.nextUrl));
  res.cookies.set(CLIENT_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
