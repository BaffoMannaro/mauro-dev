import { SignJWT, jwtVerify } from 'jose';

// Autenticazione dei CLIENTI per il portale (area.maurodev.it), separata e
// indipendente da next-auth (che resta l'autenticazione admin di Mauro).
// Sessioni stateless firmate: nessuna tabella di sessione da gestire.

const secret = new TextEncoder().encode(
  process.env.CLIENT_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'dev-insecure-change-me'
);

export const CLIENT_COOKIE = 'cliente_sessione';

type Scope = 'magic' | 'session';

async function sign(clienteId: number, scope: Scope, expiresIn: string) {
  return new SignJWT({ cid: clienteId, scope })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// Link di accesso monouso (di fatto: valido 7 giorni) generato dall'admin.
export function createMagicToken(clienteId: number) {
  return sign(clienteId, 'magic', '7d');
}

// Cookie di sessione dopo il consumo del magic link.
export function createSessionToken(clienteId: number) {
  return sign(clienteId, 'session', '30d');
}

export async function verifyClientToken(
  token: string
): Promise<{ cid: number; scope: Scope } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const cid = payload.cid;
    const scope = payload.scope;
    if (typeof cid !== 'number' || (scope !== 'magic' && scope !== 'session')) {
      return null;
    }
    return { cid, scope };
  } catch {
    return null;
  }
}
