// Esporta i pezzi SVG di react-chessboard (set cburnett) in lib/scacchi/pezzi.json, per il widget MCP.
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { defaultPieces } = await import('../node_modules/react-chessboard/dist/index.esm.js');
const { renderToStaticMarkup } = require('react-dom/server');

const out = {};
for (const [k, f] of Object.entries(defaultPieces)) {
  let svg = renderToStaticMarkup(f());
  if (!svg.includes('xmlns=')) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  out[k] = svg;
}
writeFileSync('lib/scacchi/pezzi.json', JSON.stringify(out));
console.log(Object.keys(out).join(' '));
