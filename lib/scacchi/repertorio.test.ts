import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { REPERTORIO } from './repertorio';
import { analizzaPosizioni } from './motore-node';
import { probPer } from './classifica';

describe('repertorio', () => {
  it('id unici', () => {
    expect(new Set(REPERTORIO.map((l) => l.id)).size).toBe(REPERTORIO.length);
  });

  for (const l of REPERTORIO) {
    it(`${l.id}: mosse legali e nessuna mossa di Mauro perde più del 6% secondo Stockfish`, async () => {
      const c = new Chess();
      const fens: string[] = [c.fen()];
      for (const [san] of l.mosse) {
        c.move(san);
        fens.push(c.fen());
      }
      const a = await analizzaPosizioni(fens, 12, 1);
      const problemi: string[] = [];
      l.mosse.forEach(([san], i) => {
        const colore = i % 2 === 0 ? 'w' : 'b';
        if (colore !== l.colore) return;
        const perdita = probPer(colore, a[i].eval) - probPer(colore, a[i + 1].eval);
        if (perdita > 0.06) problemi.push(`${i + 1}. ${san} perde ${(perdita * 100).toFixed(0)}%`);
      });
      const fine = probPer(l.colore, a[a.length - 1].eval);
      expect(problemi).toEqual([]);
      expect(fine).toBeGreaterThan(0.4);
    }, 60000);
  }
});
