import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import { aderenza, mappaRepertorio, persaPerTempo, PROGRAMMA } from './coach';
import { attivaProssima, avanzamento, missioneAttiva, registraRipasso, statoDrill, chiudiMissione } from './missioni';
import { salvaPartita } from './db';

describe('aderenza al repertorio', () => {
  it('Italiana col Bianco seguita: in regola', () => {
    const a = aderenza('1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O *', 'w');
    expect(a.inRegola).toBe(true);
    expect(a.mosseInRepertorio).toBe(6);
  });
  it('deviazione col Bianco: 3.Bb5 invece di 3.Bc4', () => {
    const a = aderenza('1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *', 'w', ['b-italiana-piano']);
    expect(a.inRegola).toBe(false);
    expect(a.deviazione).toEqual({ ply: 5, giocata: 'Bb5', attesa: 'Bc4' });
  });
  it('col Nero: 3...Nf6 contro l’Italiana è fuori repertorio, l’avversario che esce no', () => {
    expect(aderenza('1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 *', 'b').deviazione?.attesa).toBe('Bc5');
    const fuori = aderenza('1. e4 e5 2. Qh5 Nc6 *', 'b');
    expect(fuori.inRegola).toBe(true);
    expect(fuori.fineRepertorio).toBe(3);
  });
  it('mappa senza conflitti tra linee', () => {
    expect(mappaRepertorio('w').size).toBeGreaterThan(20);
    expect(mappaRepertorio('b').size).toBeGreaterThan(20);
  });
  it('persa per tempo', () => {
    expect(persaPerTempo('[Result "0-1"]\n[Termination "rivale won on time"]\n\n1. e4 0-1', 'w')).toBe(true);
    expect(persaPerTempo('[Result "1-0"]\n[Termination "mauro won on time"]\n\n1. e4 1-0', 'w')).toBe(false);
  });
});

describe('missioni e drill', () => {
  beforeAll(async () => {
    await attivaProssima();
  });

  it('attiva la missione 1 e conta le partite rapid in regola', async () => {
    const m = (await missioneAttiva())!;
    expect(m.codice).toBe(PROGRAMMA[0].codice);
    const dopo = new Date(Date.now() + 1000).toISOString();
    await salvaPartita({ fonte: 'chesscom', url: 'u1', cadenza: 'rapid', coloreMio: 'w', giocataIl: dopo, pgn: '[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 1-0' });
    await salvaPartita({ fonte: 'chesscom', url: 'u2', cadenza: 'rapid', coloreMio: 'b', giocataIl: dopo, pgn: '[Result "1-0"]\n[Termination "x won on time"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 1-0' });
    await salvaPartita({ fonte: 'chesscom', url: 'u3', cadenza: 'blitz', coloreMio: 'w', giocataIl: dopo, pgn: '1. d4 *' });
    const a = await avanzamento(m);
    expect(a.giocate).toBe(2);
    expect(a.inRegola).toBe(1);
    expect(a.persePerTempo).toBe(1);
    expect(a.deviazioni[0]).toMatchObject({ mossa: 'Nf6', attesa: 'Bc5' });
    expect(a.obiettivi.find((o) => o.testo.includes('tempo'))?.ok).toBe(false);
  });

  it('dopo aver completato la 1 attiva la 2', async () => {
    await chiudiMissione((await missioneAttiva())!.id, 'completata', 'Bene');
    await attivaProssima();
    expect((await missioneAttiva())!.codice).toBe(PROGRAMMA[1].codice);
  });

  it('drill: un giro perfetto alza il livello, un errore lo abbassa', async () => {
    expect((await registraRipasso('b-italiana-piano', 0)).livello).toBe(1);
    expect((await registraRipasso('b-italiana-piano', 0)).livello).toBe(2);
    expect((await registraRipasso('b-italiana-piano', 2)).livello).toBe(1);
    const s = await statoDrill();
    expect(s['b-italiana-piano']).toMatchObject({ ripassi: 3, errori: 2 });
    await expect(registraRipasso('inesistente', 0)).rejects.toThrow();
  });
});
