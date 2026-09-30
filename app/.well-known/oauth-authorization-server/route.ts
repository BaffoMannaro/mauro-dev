import { CORS, issuer, SCOPE } from '@/lib/mcp/oauth';

// RFC 8414: metadati dell'authorization server del connettore MCP.
export function GET(req: Request) {
  const iss = issuer(req);
  return Response.json(
    {
      issuer: iss,
      authorization_endpoint: `${iss}/api/oauth/authorize`,
      token_endpoint: `${iss}/api/oauth/token`,
      registration_endpoint: `${iss}/api/oauth/register`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      scopes_supported: [SCOPE],
      client_id_metadata_document_supported: true,
      authorization_response_iss_parameter_supported: true,
    },
    { headers: CORS }
  );
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
