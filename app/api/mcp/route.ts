import { createMcpHandler, withMcpAuth } from 'mcp-handler';
import { ADMIN_EMAIL, baseApp, SCOPE, verifica } from '@/lib/mcp/oauth';
import { ISTRUZIONI, registraStrumenti } from '@/lib/mcp/tools';

// Connettore MCP per Claude: https://app.maurodev.it/api/mcp (OAuth con il login Google del gestionale).
// mcp-handler tipizza serverInfo come { name, version } ma lo passa intero a McpServer,
// che accetta l'Implementation completa: titolo, sito e icona del connettore in Claude.
const serverInfo = {
  name: 'maurodev-gestionale',
  title: 'Mauro Dev',
  version: '1.0.0',
  websiteUrl: 'https://maurodev.it',
  icons: [{ src: `${baseApp()}/mcp-icon.png`, mimeType: 'image/png', sizes: ['512x512'] }],
};

const handler = createMcpHandler(registraStrumenti, {
  serverInfo: serverInfo as { name: string; version: string },
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
