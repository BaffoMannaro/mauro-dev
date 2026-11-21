import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Sql } from '@/test/db-pglite';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import dbSql from '@/lib/db';
import { leggiPartita, listaPartite, salvaCommenti, salvaImpostazioni, salvaPartita, salvaReview } from './db';
import type { Review } from './partita';

const sql = dbSql as unknown as Sql;
void sql;

const PGN = `[White "mauro"]
[Black "rivale"]
[WhiteElo "1200"]
[BlackElo "1250"]
[Result "0-1"]
[UTCDate "2026.11.01"]
[UTCTime "10:00:00"]
[Link "https://www.chess.com/game/live/1"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 0-1`;

describe('scacchi db', () => {
  beforeAll(async () => {
    await salvaImpostazioni({ username: 'mauro' });
  });

  it('salva, deduce colore ed esito, deduplica per url', async () => {
    const id = await salvaPartita({ fonte: 'chesscom', pgn: PGN });
    expect(id).toBeTruthy();
    expect(await salvaPartita({ fonte: 'chesscom', pgn: PGN })).toBeNull();
    const [p] = await listaPartite();
    expect(p.colore_mio).toBe('w');
    expect(p.esito_mio).toBe('persa');
    expect(p.apertura).toMatch(/Italian/);
    expect(p.mosse).toBe(6);
  });

  it('review e commenti', async () => {
    const [p] = await listaPartite();
    const review = { mosse: [], accuratezza: { w: 81.2, b: 90 }, conteggi: {} } as unknown as Review;
    await salvaReview(p.id, review);
    await salvaCommenti(p.id, [{ ply: 3, testo: 'Bene lo sviluppo', linea: ['Bc4', 'Nf6'] }]);
    await salvaCommenti(p.id, [{ ply: 3, testo: 'Aggiornato' }]);
    await expect(salvaCommenti(p.id, [{ ply: 99, testo: 'x' }])).rejects.toThrow();
    const c = await leggiPartita(p.id);
    expect(c?.accuratezza_mia).toBe(81.2);
    expect(c?.commentiLista).toEqual([{ ply: 3, testo: 'Aggiornato', linea: [], autore: 'claude' }]);
    expect((await listaPartite({ analizzate: false })).length).toBe(0);
    expect((await listaPartite({ esito: 'persa', apertura: 'italian' })).length).toBe(1);
  });
});
