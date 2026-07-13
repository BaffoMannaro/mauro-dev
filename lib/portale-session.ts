import { NextRequest } from 'next/server';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';

// Ritorna l'id del cliente autenticato dalla sessione portale, o null.
export async function clienteDallaRichiesta(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(CLIENT_COOKIE)?.value;
  const session = token ? await verifyClientToken(token) : null;
  if (!session || session.scope !== 'session') return null;
  return session.cid;
}
