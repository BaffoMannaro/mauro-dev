// Genera lib/scacchi/aperture.json dai TSV di lichess-org/chess-openings (CC0).
// Uso: node scripts/genera-aperture.mjs <cartella con a.tsv ... e.tsv>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Chess } from 'chess.js';

const dir = process.argv[2];
if (!dir) throw new Error('Indica la cartella dei TSV');
const out = {};
for (const f of ['a', 'b', 'c', 'd', 'e']) {
  const righe = readFileSync(join(dir, `${f}.tsv`), 'utf8').trim().split('\n').slice(1);
  for (const r of righe) {
    const [eco, name, pgn] = r.split('\t');
    const c = new Chess();
    c.loadPgn(pgn);
    const epd = c.fen().split(' ').slice(0, 4).join(' ');
    const mosse = c.history().join(' ');
    // A parità di posizione tengo la linea più corta (nome più generale).
    if (!out[epd] || out[epd][2].split(' ').length > mosse.split(' ').length) out[epd] = [eco, name, mosse];
  }
}
writeFileSync('lib/scacchi/aperture.json', JSON.stringify(out));
console.log(Object.keys(out).length, 'posizioni');
