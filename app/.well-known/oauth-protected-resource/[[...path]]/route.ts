import { generateProtectedResourceMetadata } from 'mcp-handler';
import { CORS, issuer, resourceUrl, SCOPE } from '@/lib/mcp/oauth';

// RFC 9728: /.well-known/oauth-protected-resource (anche con suffisso /api/mcp).
export function GET(req: Request) {
  return Response.json(
    generateProtectedResourceMetadata({
      authServerUrls: [issuer(req)],
      resourceUrl: resourceUrl(req),
      additionalMetadata: { scopes_supported: [SCOPE], resource_name: 'Gestionale Mauro Dev' },
    }),
    { headers: CORS }
  );
}

export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
