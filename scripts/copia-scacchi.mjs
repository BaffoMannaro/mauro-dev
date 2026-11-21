// Copia in public/ i file statici della tab Scacchi presi da node_modules
// (motore Stockfish e librerie del widget MCP). Gira prima di dev e build.
import { copyFileSync, mkdirSync } from 'node:fs';

const copie = [
  ['node_modules/stockfish/bin/stockfish-19-lite-single.js', 'public/scacchi/engine/stockfish-19-lite-single.js'],
  ['node_modules/stockfish/bin/stockfish-19-lite-single.wasm', 'public/scacchi/engine/stockfish-19-lite-single.wasm'],
  ['node_modules/stockfish/Copying.txt', 'public/scacchi/engine/COPYING.txt'],
  ['node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js', 'public/scacchi/vendor/ext-apps.js'],
  ['node_modules/chess.js/dist/esm/chess.js', 'public/scacchi/vendor/chess.js'],
];
mkdirSync('public/scacchi/engine', { recursive: true });
mkdirSync('public/scacchi/vendor', { recursive: true });
for (const [da, a] of copie) copyFileSync(da, a);
console.log('scacchi: copiati', copie.length, 'file statici');
