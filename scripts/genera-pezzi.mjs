// Inserisce gli SVG del set predefinito (public/scacchi/pezzi/<set>) in lib/scacchi/pezzi.json, per il widget MCP.
// Uso: node scripts/genera-pezzi.mjs [set]   (default: staunty)
import { readFileSync, writeFileSync } from 'node:fs';

const set = process.argv[2] ?? 'staunty';
const out = {};
for (const c of ['w', 'b']) for (const p of ['K', 'Q', 'R', 'B', 'N', 'P']) {
  out[c + p] = readFileSync(`public/scacchi/pezzi/${set}/${c}${p}.svg`, 'utf8').trim();
}
writeFileSync('lib/scacchi/pezzi.json', JSON.stringify(out));
console.log('pezzi.json da', set);
