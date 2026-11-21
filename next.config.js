/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['maurodev.it', 'www.maurodev.it', 'app.maurodev.it', 'area.maurodev.it'],
    },
  },
  // Scacchi: il tool MCP scacchi_analizza_posizione avvia Stockfish (WASM) in un processo Node.
  serverExternalPackages: ['stockfish'],
  // Solo la versione lite (1.8MB): le versioni complete pesano 95MB l'una.
  outputFileTracingExcludes: {
    '/*': ['./node_modules/stockfish/bin/stockfish-19.*', './node_modules/stockfish/bin/stockfish-19-single.*', './node_modules/stockfish/bin/stockfish-19-asm.js', './node_modules/stockfish/bin/stockfish-19-lite.*'],
  },
  outputFileTracingIncludes: {
    '/api/mcp': [
      './node_modules/stockfish/index.js',
      './node_modules/stockfish/package.json',
      './node_modules/stockfish/scripts/**/*',
      './node_modules/stockfish/bin/stockfish-19-lite-single.*',
    ],
  },
  async headers() {
    return [
      {
        source: '/scacchi/engine/:file*.wasm',
        headers: [{ key: 'Content-Type', value: 'application/wasm' }],
      },
    ];
  },
};

module.exports = nextConfig;
