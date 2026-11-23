import { describe, expect, it } from 'vitest';
import { calcolaConfronto, fasciaDi, giudica } from './confronto';
import type { Review, MossaReview } from './partita';
import type { Classificazione } from './classifica';

const FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
function review(w: Classificazione[], b: Classificazione[], acc: { w: number; b: number }): Review {
  const mosse: MossaReview[] = [];
  const n = Math.max(w.length, b.length);
  for (let i = 0; i < n * 2; i++) {
    const colore = i % 2 === 0 ? 'w' : 'b';
    const c = (colore === 'w' ? w : b)[Math.floor(i / 2)];
    if (!c) continue;
    mosse.push({ ply: 30 + i, colore, san: 'x', uci: 'a2a3', fenPrima: FEN, fenDopo: FEN, evalPrima: { cp: 0, mate: null }, evalDopo: { cp: 0, mate: null }, migliore: null, migliorSan: null, pvMigliore: [], classificazione: c, perdita: 0, accuratezza: 90 } as MossaReview);
  }
  return { mosse, accuratezza: acc, conteggi: {} as Review['conteggi'] };
}

describe('confronto con gli avversari del proprio Elo', () => {
  const righe = [
    { colore_mio: 'w' as const, cadenza: 'rapid', elo_bianco: 920, elo_nero: 950, review: review(['grave', 'migliore', 'brillante', 'buona'], ['migliore', 'migliore', 'errore', 'buona'], { w: 70, b: 80 }) },
    { colore_mio: 'b' as const, cadenza: 'rapid', elo_bianco: 900, elo_nero: 960, review: review(['grave', 'grave', 'buona', 'buona'], ['migliore', 'buona', 'buona', 'buona'], { w: 60, b: 90 }) },
    // Esclusa: differenza di Elo oltre 150.
    { colore_mio: 'w' as const, cadenza: 'rapid', elo_bianco: 900, elo_nero: 1300, review: review(['grave'], ['grave'], { w: 10, b: 10 }) },
    // Esclusa: partita contro il bot.
    { colore_mio: 'w' as const, cadenza: 'bot', elo_bianco: 900, elo_nero: 900, review: review(['grave'], ['grave'], { w: 10, b: 10 }) },
  ];
  const c = calcolaConfronto(righe);

  it('gruppi per cadenza e fascia, con il totale', () => {
    expect(c.map((x) => `${x.cadenza}|${x.fascia}`)).toEqual(['rapid|tutte', 'rapid|900-999']);
    expect(fasciaDi(955)).toBe('900-999');
  });

  it('metriche separate per Mauro e avversari', () => {
    const t = c[0];
    expect(t.io.partite).toBe(2);
    expect(t.io.accuratezza).toBe(80); // 70 col Bianco, 90 col Nero
    expect(t.avversari.accuratezza).toBe(70); // 80 e 60
    expect(t.io.gravi100).toBe(12.5); // 1 grave su 8 sue mosse
    expect(t.avversari.gravi100).toBe(25); // 2 gravi su 8 mosse degli avversari
    expect(t.io.brillanti10).toBe(5);
  });

  it('giudizio con margine', () => {
    expect(giudica(80, 70, true, true)).toBe('meglio');
    expect(giudica(70.5, 70, true, true)).toBe('in linea');
    expect(giudica(6, 4, false)).toBe('peggio');
    expect(giudica(null, 4, false)).toBeNull();
  });
});
