import { describe, expect, it } from 'vitest';
import { calcolaMesi, fmtMinuti, parseOre } from './canone-calcolo';

const canone = { ore_mese: 8, prezzo_mese: 320, tariffa_extra: 50, inizio: '2026-11-01' };
const h = (ore: number) => ore * 60;

describe('calcolaMesi', () => {
  it('primo mese: 8 ore incluse, usate 4, ne restano 4 che passano al mese dopo', () => {
    const [nov] = calcolaMesi(canone, [{ data: '2026-11-12', minuti: h(4) }], '2026-11-13');
    expect(nov).toMatchObject({ mese: '2026-11', incluse: h(8), riportate: 0, usate: h(4), extra: 0, rimaste: h(4), riporto_prossimo: h(4) });
  });

  it('le ore riportate valgono un solo mese e si consumano per prime', () => {
    const mesi = calcolaMesi(
      canone,
      [
        { data: '2026-11-05', minuti: h(2) }, // nov: restano 6
        { data: '2026-12-10', minuti: h(3) }, // dic: 3 dalle 6 riportate, ne scadono 3
      ],
      '2027-01-15'
    );
    const [nov, dic, gen] = mesi;
    expect(nov.riporto_prossimo).toBe(h(6));
    expect(dic).toMatchObject({ riportate: h(6), da_riporto: h(3), da_incluse: 0, scadono: h(3), riporto_prossimo: h(8) });
    // Gennaio riceve solo le 8 di dicembre: le 3 di novembre sono scadute.
    expect(gen).toMatchObject({ riportate: h(8), usate: 0, rimaste: h(16) });
  });

  it('oltre il disponibile le ore sono extra a tariffa piena', () => {
    const [nov, dic] = calcolaMesi(
      canone,
      [
        { data: '2026-11-05', minuti: h(10) },
        { data: '2026-12-05', minuti: h(9) },
      ],
      '2026-12-20'
    );
    expect(nov).toMatchObject({ extra: h(2), costo_extra: 100, rimaste: 0, riporto_prossimo: 0 });
    expect(dic).toMatchObject({ riportate: 0, extra: h(1), costo_extra: 50 });
  });

  it('gli interventi fuori canone non consumano ore', () => {
    const [nov] = calcolaMesi(
      canone,
      [
        { data: '2026-11-13', minuti: 90, fuori_canone: true },
        { data: '2026-11-13', minuti: 30 },
      ],
      '2026-11-30'
    );
    expect(nov).toMatchObject({ usate: 30, fuori_canone: 90, rimaste: h(8) - 30 });
  });

  it('mesi senza interventi e canone con fine', () => {
    const mesi = calcolaMesi({ ...canone, fine: '2026-12-31' }, [], '2027-03-01');
    expect(mesi.map((m) => m.mese)).toEqual(['2026-11', '2026-12']);
    expect(calcolaMesi(canone, [], '2026-10-01')).toEqual([]);
  });

  it('cambio d’anno', () => {
    const mesi = calcolaMesi({ ...canone, inizio: '2026-12-01' }, [], '2027-01-02');
    expect(mesi.map((m) => m.mese)).toEqual(['2026-12', '2027-01']);
  });
});

describe('formati', () => {
  it('fmtMinuti', () => {
    expect(fmtMinuti(210)).toBe('3 h 30 min');
    expect(fmtMinuti(45)).toBe('45 min');
    expect(fmtMinuti(120)).toBe('2 h');
  });
  it('parseOre', () => {
    expect(parseOre('1:30')).toBe(90);
    expect(parseOre('1,5')).toBe(90);
    expect(parseOre('2h')).toBe(120);
    expect(parseOre('45m')).toBe(45);
    expect(parseOre('abc')).toBeNull();
    expect(parseOre(0.25)).toBe(15);
  });
});
