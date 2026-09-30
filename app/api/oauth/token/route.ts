import { CORS, emettiToken, erroreOAuth, pkceOk, verifica } from '@/lib/mcp/oauth';

// Token endpoint: authorization_code (con PKCE S256) e refresh_token.
export async function POST(req: Request) {
  const tipo = req.headers.get('content-type') ?? '';
  const p: Record<string, string> = tipo.includes('application/json')
    ? await req.json().catch(() => ({}))
    : Object.fromEntries(new URLSearchParams(await req.text()));

  console.log('[oauth] token', p.grant_type, 'client', p.client_id ?? '-');
  if (p.grant_type === 'authorization_code') {
    const code = p.code ? await verifica('code', p.code) : null;
    if (!code) return erroreOAuth('invalid_grant', 'Codice non valido o scaduto');
    if (code.ru !== p.redirect_uri) return erroreOAuth('invalid_grant', 'redirect_uri non corrisponde');
    if (p.client_id && code.cid !== p.client_id) return erroreOAuth('invalid_grant', 'client_id non corrisponde');
    if (!p.code_verifier || !pkceOk(p.code_verifier, String(code.cc))) {
      return erroreOAuth('invalid_grant', 'PKCE non valido');
    }
    return Response.json(await emettiToken(String(code.cid), String(code.sub)), {
      headers: { ...CORS, 'Cache-Control': 'no-store' },
    });
  }

  if (p.grant_type === 'refresh_token') {
    const rt = p.refresh_token ? await verifica('refresh', p.refresh_token) : null;
    if (!rt) return erroreOAuth('invalid_grant', 'Refresh token non valido o scaduto');
    return Response.json(await emettiToken(String(rt.cid), String(rt.sub)), {
      headers: { ...CORS, 'Cache-Control': 'no-store' },
    });
  }

  return erroreOAuth('unsupported_grant_type', 'grant_type non supportato');
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
