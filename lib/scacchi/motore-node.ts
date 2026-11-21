// Stockfish lato server (Node): stesso motore WASM della pagina, in un processo figlio.
// Serve al tool MCP che valuta posizioni e varianti, e ai test.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { Chess } from 'chess.js';
import type { AnalisiPosizione } from './partita';
import type { Valutazione } from './classifica';

const require_ = createRequire(import.meta.url);

function percorsoMotore(): string {
  // findEngine risolve il file dentro node_modules/stockfish/bin
  const sf = require_('stockfish') as { findEngine: (k: string) => string };
  return sf.findEngine('lite-single');
}

function alBianco(fen: string, v: Valutazione): Valutazione {
  const nero = fen.split(' ')[1] === 'b';
  if (v.mate !== null) {
    if (v.mate === 0) return { cp: nero ? 100000 : -100000, mate: null };
    return { cp: null, mate: nero ? -v.mate : v.mate };
  }
  return { cp: nero ? -(v.cp ?? 0) : v.cp, mate: null };
}

/** Analizza più posizioni in sequenza con un solo processo. */
export async function analizzaPosizioni(fens: string[], profondita = 14, multipv = 2): Promise<AnalisiPosizione[]> {
  const proc = spawn(process.execPath, [percorsoMotore()], { stdio: ['pipe', 'pipe', 'ignore'] });
  let buffer = '';
  const ascolta: ((r: string) => void)[] = [];
  proc.stdout.on('data', (d: Buffer) => {
    buffer += d.toString();
    let i: number;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const riga = buffer.slice(0, i).trim();
      buffer = buffer.slice(i + 1);
      for (const f of ascolta) f(riga);
    }
  });
  const invia = (c: string) => proc.stdin.write(c + '\n');
  const attendi = (cmd: string, fine: (r: string) => boolean, onRiga?: (r: string) => void) =>
    new Promise<string>((ok) => {
      const f = (r: string) => {
        onRiga?.(r);
        if (fine(r)) {
          ascolta.splice(ascolta.indexOf(f), 1);
          ok(r);
        }
      };
      ascolta.push(f);
      invia(cmd);
    });

  try {
    await attendi('uci', (r) => r === 'uciok');
    invia(`setoption name MultiPV value ${multipv}`);
    await attendi('isready', (r) => r === 'readyok');
    const out: AnalisiPosizione[] = [];
    for (const fen of fens) {
      const g = new Chess(fen);
      if (g.isGameOver()) {
        const cp = g.isCheckmate() ? (g.turn() === 'w' ? -100000 : 100000) : 0;
        out.push({ fen, eval: { cp, mate: null }, migliore: null, pv: [], seconda: null, profondita: 0 });
        continue;
      }
      const linee: Record<number, { eval: Valutazione; pv: string[]; depth: number }> = {};
      invia(`position fen ${fen}`);
      await attendi(`go depth ${profondita}`, (r) => r.startsWith('bestmove'), (r) => {
        if (!r.startsWith('info') || !r.includes(' pv ') || !r.includes(' score ')) return;
        const t = r.split(' ');
        const s = t.indexOf('score');
        const mp = t.indexOf('multipv');
        const d = t.indexOf('depth');
        const v = Number(t[s + 2]);
        linee[mp >= 0 ? Number(t[mp + 1]) : 1] = {
          eval: t[s + 1] === 'mate' ? { cp: null, mate: v } : { cp: v, mate: null },
          pv: t.slice(t.indexOf('pv') + 1),
          depth: Number(t[d + 1]),
        };
      });
      out.push({
        fen,
        eval: linee[1] ? alBianco(fen, linee[1].eval) : { cp: 0, mate: null },
        migliore: linee[1]?.pv[0] ?? null,
        pv: linee[1]?.pv ?? [],
        seconda: linee[2] ? alBianco(fen, linee[2].eval) : null,
        profondita: linee[1]?.depth ?? 0,
      });
    }
    return out;
  } finally {
    proc.stdin.end('quit\n');
    setTimeout(() => proc.kill(), 200).unref();
  }
}
