import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { FINALI, SOGLIA_PATTA, SOGLIA_VINTA } from './finali';
import { leggiSegni } from './repertorio';
import { analizzaPosizioni } from './motore-node';
import { probPer } from './classifica';

describe('finali', () => {
  for (const f of FINALI) {
    it(`${f.id}: posizione legale, risultato coerente con l'obiettivo, frecce verdi che mantengono il risultato`, async () => {
      const c = new Chess(f.fen);
      expect(c.turn()).toBe(f.colore);
      const [a] = await analizzaPosizioni([f.fen], 18, 1);
      const p = probPer(f.colore, a.eval);
      if (f.obiettivo === 'patta') expect(Math.abs(p - 0.5)).toBeLessThan(0.15);
      else expect(p).toBeGreaterThan(SOGLIA_VINTA);
      for (const s of leggiSegni(f.segni)) {
        if (!('da' in s) || s.c !== 'g') continue;
        const g = new Chess(f.fen);
        const m = g.move({ from: s.da, to: s.a, promotion: 'q' });
        expect(m).toBeTruthy();
        const [d] = await analizzaPosizioni([g.fen()], 16, 1);
        const pd = probPer(f.colore, d.eval);
        if (f.obiettivo === 'patta') expect(pd).toBeGreaterThan(SOGLIA_PATTA);
        else expect(pd).toBeGreaterThan(SOGLIA_VINTA);
      }
    }, 60000);
  }
});

import { esitoDopoMiaMossa, esitoDopoRisposta } from './finali';
import { vi, beforeAll } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

describe('esito delle mosse nei finali', () => {
  const vinci = FINALI.find((f) => f.id === 'donna-re')!;
  const promuovi = FINALI.find((f) => f.id === 'lucena')!;
  const patta = FINALI.find((f) => f.id === 'philidor')!;
  const no = { matto: false, patta: false, stallo: false };
  it('matto e stallo', () => {
    expect(esitoDopoMiaMossa(vinci, { ...no, matto: true }, null, false, 5).stato).toBe('riuscito');
    expect(esitoDopoMiaMossa(vinci, { ...no, patta: true, stallo: true }, null, false, 5).messaggio).toMatch(/Stallo/);
  });
  it('vittoria buttata, promozione, mosse finite', () => {
    expect(esitoDopoMiaMossa(vinci, no, 0.5, false, 3).stato).toBe('fallito');
    expect(esitoDopoMiaMossa(promuovi, no, 0.99, true, 6).stato).toBe('riuscito');
    expect(esitoDopoMiaMossa(vinci, no, 0.99, false, vinci.mosse).stato).toBe('fallito');
    expect(esitoDopoMiaMossa(vinci, no, 0.99, false, 2).stato).toBe('continua');
  });
  it('patta tenuta o persa', () => {
    expect(esitoDopoMiaMossa(patta, no, 0.45, false, patta.mosse).stato).toBe('riuscito');
    expect(esitoDopoMiaMossa(patta, no, 0.1, false, 3).stato).toBe('fallito');
    expect(esitoDopoRisposta(patta, { matto: false, patta: true }).stato).toBe('riuscito');
    expect(esitoDopoRisposta(vinci, { matto: true, patta: false }).stato).toBe('fallito');
  });
});

describe('progressi finali', () => {
  beforeAll(async () => {});
  it('registra tentativi e minimo di mosse', async () => {
    const { registraFinale, progressiFinali } = await import('./finali-db');
    await registraFinale('donna-re', false, 0);
    await registraFinale('donna-re', true, 12);
    await registraFinale('donna-re', true, 9);
    await registraFinale('donna-re', false, 0);
    expect((await progressiFinali())['donna-re']).toMatchObject({ completato: true, migliori: 9, tentativi: 4 });
    await expect(registraFinale('nope', true, 1)).rejects.toThrow();
  });
});
