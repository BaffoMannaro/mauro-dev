import { randomUUID } from 'crypto';
import { CORS, erroreOAuth, redirectAmmesso } from '@/lib/mcp/oauth';

// RFC 7591 (Dynamic Client Registration), stateless: il client_id non viene salvato,
// la sicurezza è data dall'allowlist dei redirect e dal consenso esplicito.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const uris: unknown = body?.redirect_uris;
  if (!Array.isArray(uris) || uris.length === 0 || !uris.every((u) => typeof u === 'string' && redirectAmmesso(u))) {
    return erroreOAuth('invalid_redirect_uri', 'redirect_uris non ammessi');
  }

  return Response.json(
    {
      client_id: `mcp-${randomUUID()}`,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: typeof body.client_name === 'string' ? body.client_name : undefined,
      redirect_uris: uris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    { status: 201, headers: CORS }
  );
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
