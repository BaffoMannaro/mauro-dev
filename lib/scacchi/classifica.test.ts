import { describe, expect, it } from 'vitest';
import {
  accuratezzaMossa,
  accuratezzaPartita,
  bilancioMateriale,
  classificaMossa,
  formattaValutazione,
  probVittoria,
} from './classifica';
import { analizzaPosizioni } from './motore-node';
import { apertura, aperturaPartita, costruisciReview, leggiPgn } from './partita';

const cp = (x: number) => ({ cp: x, mate: null });

describe('probabilità e accuratezza', () => {
  it('parità = 50%, vantaggio del Bianco > 50%', () => {
    expect(probVittoria(cp(0))).toBeCloseTo(0.5);
    expect(probVittoria(cp(300))).toBeGreaterThan(0.7);
    expect(probVittoria({ cp: null, mate: -2 })).toBe(0);
  });
  it('accuratezza: nessuna perdita = 100, perdita grande ≈ 0', () => {
    expect(accuratezzaMossa(60, 60)).toBeCloseTo(100, 2);
    expect(accuratezzaMossa(90, 10)).toBeLessThan(5);
  });
  it('accuratezza partita penalizza un errore grave', () => {
    expect(accuratezzaPartita([100, 100, 100])).toBe(100);
    expect(accuratezzaPartita([100, 100, 5])!).toBeLessThan(60);
  });
  it('materiale e formato', () => {
    expect(bilancioMateriale('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBN1 w - - 0 1', 'w')).toBe(-5);
    expect(formattaValutazione(cp(120))).toBe('+1.2');
    expect(formattaValutazione({ cp: null, mate: -3 })).toBe('-M3');
  });
});

describe('classificazione', () => {
  const base = { colore: 'w' as const, giocata: 'e2e4', migliore: 'e2e4', prima: cp(30), dopo: cp(30) };
  it('mossa migliore', () => expect(classificaMossa(base).classificazione).toBe('migliore'));
  it('soglie di perdita', () => {
    expect(classificaMossa({ ...base, migliore: 'd2d4', dopo: cp(10) }).classificazione).toBe('eccellente');
    expect(classificaMossa({ ...base, migliore: 'd2d4', dopo: cp(-60) }).classificazione).toBe('imprecisione');
    expect(classificaMossa({ ...base, migliore: 'd2d4', dopo: cp(-500) }).classificazione).toBe('grave');
  });
  it('dal punto di vista del Nero', () => {
    const m = classificaMossa({ colore: 'b', giocata: 'e7e5', migliore: 'c7c5', prima: cp(30), dopo: cp(400) });
    expect(m.classificazione).toBe('grave');
  });
  it('libro e brillante', () => {
    expect(classificaMossa({ ...base, libro: true }).classificazione).toBe('libro');
    expect(classificaMossa({ ...base, sacrificio: 3, prima: cp(50), dopo: cp(60) }).classificazione).toBe('brillante');
  });
  it('ottima: unica mossa', () => {
    expect(classificaMossa({ ...base, secondaPrima: cp(-300) }).classificazione).toBe('ottima');
  });
});

describe('PGN e aperture', () => {
  it('legge PGN e trova l’apertura', () => {
    const p = leggiPgn('[White "A"]\n[Black "B"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 *');
    expect(p.mosse).toHaveLength(6);
    expect(p.mosse[0].uci).toBe('e2e4');
    expect(aperturaPartita(p)?.nome).toMatch(/Italian/);
    expect(apertura(p.mosse[1].fenDopo)).not.toBeNull();
  });
});

describe('review con Stockfish vero', () => {
  it('riconosce il matto del barbiere subito e l’errore grave che lo permette', async () => {
    const p = leggiPgn('1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0');
    const fens = [p.fenIniziale, ...p.mosse.map((m) => m.fenDopo)];
    const analisi = await analizzaPosizioni(fens, 10);
    const r = costruisciReview(p, analisi);
    expect(r.mosse).toHaveLength(7);
    const nf6 = r.mosse[5];
    expect(nf6.san).toBe('Nf6');
    expect(nf6.classificazione).toBe('grave');
    expect(nf6.migliorSan).toBeTruthy();
    expect(r.mosse[6].classificazione).toBe('migliore'); // Qxf7#
    expect(r.accuratezza.b!).toBeLessThan(r.accuratezza.w!);
  });
});
