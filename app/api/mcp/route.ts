import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { ADMIN_EMAIL, SCOPE, verifica } from '@/lib/mcp/oauth';
import { ISTRUZIONI, registraStrumenti } from '@/lib/mcp/tools';

// Connettore MCP per Claude: https://app.maurodev.it/api/mcp (OAuth con il login Google del gestionale).
const handler = createMcpHandler(registraStrumenti, {
  serverInfo: { name: 'maurodev-gestionale', version: '1.0.0' },
  instructions: ISTRUZIONI,
});

const conAuth = withMcpAuth(
  handler,
  async (_req, token) => {
    const p = token ? await verifica('access', token) : null;
    if (!p || p.sub !== ADMIN_EMAIL) return undefined;
    return { token: token!, clientId: String(p.cid), scopes: [SCOPE], expiresAt: p.exp };
  },
  { required: true }
);

export { conAuth as GET, conAuth as POST, conAuth as DELETE };
