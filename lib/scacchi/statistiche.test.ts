import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import { calcolaStatistiche, faseDi, finale, statistiche } from './statistiche';
import { candidatiPuzzle, puzzleDaFare, registraTentativo, riepilogoPuzzle, sincronizzaPuzzle } from './puzzle';
import { analizzaPosizioni } from './motore-node';
import { costruisciReview, leggiPgn, type Review } from './partita';
import { salvaPartita, salvaReview } from './db';

const MATTO_MANCATO = '[White "mauro"]\n[Black "x"]\n[Result "*"]\n\n1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. d3 *';

async function review(pgn: string): Promise<Review> {
  const p = leggiPgn(pgn);
  const a = await analizzaPosizioni([p.fenIniziale, ...p.mosse.map((m) => m.fenDopo)], 10, 2);
  return costruisciReview(p, a);
}

describe('statistiche pure', () => {
  it('fase e finale', () => {
    expect(faseDi(5, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe('apertura');
    expect(faseDi(40, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')).toBe('mediogioco');
    expect(faseDi(40, '8/5k2/8/8/3R4/8/2K5/r7 w - - 0 1')).toBe('finale');
    expect(finale('[Termination "x won on time"]')).toBe('tempo');
    expect(finale('[Termination "x won by resignation"]')).toBe('abbandono');
  });

  it('aggrega esiti, aperture e come perdo', () => {
    const base = { pgn: '[Termination "x won by checkmate"]', cadenza: 'blitz', eco: 'C50', elo_bianco: 800, elo_nero: 820, review: null };
    const s = calcolaStatistiche([
      { ...base, id: 1, colore_mio: 'w', esito_mio: 'persa', apertura: 'Italian Game: Giuoco Piano', giocata_il: '2026-01-10T20:00:00Z' },
      { ...base, id: 2, colore_mio: 'w', esito_mio: 'vinta', apertura: 'Italian Game', giocata_il: '2026-01-11T09:00:00Z' },
      { ...base, id: 3, colore_mio: 'b', esito_mio: 'patta', apertura: 'Sicilian Defense', giocata_il: '2025-05-01T09:00:00Z', pgn: '[Termination "drawn by repetition"]' },
    ]);
    expect(s.totale).toEqual({ n: 3, v: 1, p: 1, x: 1 });
    expect(s.aperture[0]).toMatchObject({ colore: 'w', famiglia: 'Italian Game', esiti: { n: 2 } });
    expect(s.comePerdo).toEqual({ matto: 1 });
    expect(s.comePareggio).toEqual({ ripetizione: 1 });
    expect(s.perAnno.map((a) => a.anno)).toEqual([2025, 2026]);
    expect(s.ratingMensile.find((m) => m.mese === '2026-01')?.rating).toBe(800);
  });
});

describe('puzzle dai propri errori', () => {
  let r: Review;
  beforeAll(async () => {
    r = await review(MATTO_MANCATO);
  });

  it('il matto mancato diventa un puzzle con soluzione Qxf7#', () => {
    const c = candidatiPuzzle(r, 'w');
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ ply: 7, soluzione_san: 'Qxf7#', giocata_san: 'd3', tema: 'Matto' });
    expect(candidatiPuzzle(r, 'b')).toHaveLength(0);
  });

  it('sincronizza, mostra e ripete con la ripetizione spaziata', async () => {
    const id = (await salvaPartita({ fonte: 'pgn', coloreMio: 'w', pgn: MATTO_MANCATO }))!;
    await salvaReview(id, r);
    expect(await sincronizzaPuzzle()).toBe(1);
    expect(await sincronizzaPuzzle()).toBe(0);
    const [p] = await puzzleDaFare();
    expect(p.soluzione).toBe('h5f7');
    expect((await registraTentativo(p.id, true)).livello).toBe(1);
    expect(await puzzleDaFare()).toHaveLength(0);
    const ri = await riepilogoPuzzle();
    expect(ri).toMatchObject({ totali: 1, da_fare: 0, risolti: 1 });
    const s = await statistiche();
    expect(s.analizzate).toBe(1);
    expect(s.errori.mattiMancati).toBe(1);
    expect(s.errori.perFase.apertura.gravi).toBeGreaterThanOrEqual(1);
  });
});
