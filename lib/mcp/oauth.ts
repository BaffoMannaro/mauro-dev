import { createHash } from 'crypto';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getPublicOrigin } from 'mcp-handler';

// Server OAuth 2.1 minimale e stateless per il connettore MCP di Claude.
// L'utente si autentica con il login Google del gestionale (next-auth, solo Mauro);
// codici e token sono JWT firmati, quindi niente tabelle da gestire.
//
// Revoca: cambiando MCP_TOKEN_VERSION (env) tutti i token emessi smettono di valere.

export const ADMIN_EMAIL = 'altamura.mauro@gmail.com';
export const SCOPE = 'mcp';

const ACCESS_TTL = 60 * 60; // 1 ora
const REFRESH_TTL = 60 * 60 * 24 * 60; // 60 giorni
const CODE_TTL = 5 * 60;
const DOWNLOAD_TTL = 60 * 60 * 24; // link PDF: 24 ore

function chiave(): Uint8Array {
  const base = process.env.MCP_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!base) throw new Error('MCP_AUTH_SECRET/AUTH_SECRET non configurato');
  // Separazione di dominio: stessi segreti di next-auth/portale, chiave diversa.
  return createHash('sha256').update(`mcp-oauth:${base}`).digest();
}

const versione = () => process.env.MCP_TOKEN_VERSION || '1';

type Tipo = 'code' | 'access' | 'refresh' | 'download';

async function firma(tipo: Tipo, claims: JWTPayload, ttl: number) {
  return new SignJWT({ ...claims, typ: tipo, v: versione() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(chiave());
}

export async function verifica(tipo: Tipo, token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, chiave());
    if (payload.typ !== tipo || payload.v !== versione()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── URL ─────────────────────────────────────────────────────

export const issuer = (req: Request) => getPublicOrigin(req);
export const resourceUrl = (req: Request) => `${getPublicOrigin(req)}/api/mcp`;

/** Base pubblica del gestionale per i link restituiti da Claude. */
export function baseApp() {
  if (process.env.APP_HOST) return `https://${process.env.APP_HOST}`;
  return process.env.VERCEL ? 'https://app.maurodev.it' : 'http://localhost:3000';
}

/** Base del sito pubblico (pagine preventivo /p/...). */
export function baseSito() {
  return process.env.SITE_URL || (process.env.VERCEL ? 'https://maurodev.it' : 'http://localhost:3000');
}

// ─── Redirect ammessi ────────────────────────────────────────

/**
 * Solo le callback di Claude (web/desktop) e localhost (Claude Code, MCP Inspector).
 * Anche se un client registrato è arbitrario, il codice può finire solo qui.
 */
export function redirectAmmesso(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol === 'https:' && ['claude.ai', 'claude.com'].includes(u.hostname)) {
      return u.pathname === '/api/mcp/auth_callback';
    }
    return u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Client ID Metadata Document (spec MCP 2026): se il client_id è un URL https,
 * il redirect_uri deve comparire nel documento pubblicato a quell'URL.
 */
export async function verificaClientId(clientId: string, redirectUri: string): Promise<boolean> {
  if (!clientId.startsWith('https://')) return true; // client registrato via DCR
  try {
    const res = await fetch(clientId, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } });
    if (!res.ok) return false;
    const doc = await res.json();
    return doc.client_id === clientId && Array.isArray(doc.redirect_uris) && doc.redirect_uris.includes(redirectUri);
  } catch {
    return false;
  }
}

// ─── Codici e token ──────────────────────────────────────────

export interface RichiestaAutorizzazione {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  resource?: string;
}

export const creaCodice = (r: RichiestaAutorizzazione, email: string) =>
  firma('code', { cid: r.clientId, ru: r.redirectUri, cc: r.codeChallenge, res: r.resource, sub: email }, CODE_TTL);

export function pkceOk(verifier: string, challenge: string) {
  return createHash('sha256').update(verifier).digest('base64url') === challenge;
}

export async function emettiToken(clientId: string, sub: string) {
  return {
    access_token: await firma('access', { cid: clientId, sub, scope: SCOPE }, ACCESS_TTL),
    token_type: 'Bearer',
    expires_in: ACCESS_TTL,
    refresh_token: await firma('refresh', { cid: clientId, sub }, REFRESH_TTL),
    scope: SCOPE,
  };
}

/** Link firmato per scaricare il PDF di una fattura senza login (dalla chat). */
export async function linkDownloadFattura(id: number) {
  const t = await firma('download', { fid: id }, DOWNLOAD_TTL);
  return `${baseApp()}/api/fatture/${id}/pdf?t=${t}`;
}

// ─── Risposte ────────────────────────────────────────────────

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
};

export function erroreOAuth(error: string, description: string, status = 400) {
  return Response.json(
    { error, error_description: description },
    { status, headers: { ...CORS, 'Cache-Control': 'no-store' } }
  );
}
