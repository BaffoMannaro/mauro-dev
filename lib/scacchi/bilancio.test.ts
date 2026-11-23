import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import { analizzaPosizioni } from './motore-node';
import { costruisciReview, leggiPgn, type Review } from './partita';
import { tipiDi } from './tipi-errore';
import { accettaProposta, bilancioMissione, proponiMissione } from './bilancio';
import { chiudiMissione, creaMissione, avanzamento, missioneAttiva } from './missioni';
import { salvaPartita, salvaReview } from './db';
import { registraFinale } from './finali-db';
import { REPERTORIO } from './repertorio';

async function review(pgn: string): Promise<Review> {
  const p = leggiPgn(pgn);
  const a = await analizzaPosizioni([p.fenIniziale, ...p.mosse.map((m) => m.fenDopo)], 12, 2);
  return costruisciReview(p, a);
}

// Partita 2111 (mossa 8 del Nero): 8...d6 permette la forchetta Nxc6 su Donna e Alfiere.
const FORCHETTA = '[SetUp "1"]\n[FEN "r1bq1rk1/2ppbppp/p1p2n2/4N3/4P3/3P4/PPP2PPP/RNBQ1RK1 b - - 2 8"]\n[Result "*"]\n\n8... d6 9. Nxc6 *';
// Il Bianco ha matto in 1 (Re8#) con un vantaggio enorme e gioca h3: occasione mancata.
const MATTO_MANCATO = '[SetUp "1"]\n[FEN "6k1/5ppp/8/8/8/8/Q4PPP/4R1K1 w - - 0 1"]\n[Result "*"]\n\n1. h3 *';

describe('nuova classe "mancata" e tipi di errore', () => {
  it('matto in 1 non giocato in posizione già vinta: mancata e occasione', async () => {
    const r = await review(MATTO_MANCATO);
    expect(r.versione).toBe(2);
    expect(r.mosse[0].classificazione).toBe('mancata');
    expect(tipiDi(r.mosse[0], r.mosse[1], null)).toContain('occasione');
  }, 60000);

  it('la forchetta della partita 2111 è un pezzo lasciato in presa', async () => {
    const r = await review(FORCHETTA);
    expect(['errore', 'grave']).toContain(r.mosse[0].classificazione);
    expect(tipiDi(r.mosse[0], r.mosse[1], null)).toContain('regalo');
  }, 60000);

  it('legge i tempi dal PGN di chess.com', () => {
    const p = leggiPgn('[TimeControl "600"]\n\n1. e4 {[%clk 0:09:58.5]} 1... e5 {[%clk 0:00:45]} *');
    expect(p.tempoBase).toBe(600);
    expect(p.mosse.map((m) => m.clk)).toEqual([598.5, 45]);
  });
});

describe('proposta della missione', () => {
  const base = { missione_id: 1, partite: 10, analizzate: 10, errori: 8, perFase: { apertura: 2, mediogioco: 4, finale: 2 }, perTipo: [], nonConvertite: [], stalli: 0, zeitnot: 0, deviazioni: [] };
  it('minacce ignorate: controlla prima di muovere, con puzzle', () => {
    const p = proponiMissione({ ...base, problemaPrincipale: 'regalo' }, []);
    expect(p.titolo).toMatch(/Controlla prima di muovere/);
    expect(p.regole).toMatchObject({ puzzle: 15, maxGraviMedi: 1, partite: 10 });
  });
  it('vittorie buttate e stallo: finali assegnati, escluso quello già fatto', () => {
    const p = proponiMissione({ ...base, problemaPrincipale: null, stalli: 1, nonConvertite: [{ partita_id: 1, massimo: 0.95, esito: 'patta', fine: 'stallo' }] }, ['donna-re']);
    expect(p.titolo).toMatch(/Chiudi le partite vinte/);
    expect(p.regole.finali).toEqual(['torre-re', 'pedone-opposizione', 'quadrato']);
  });
  it('drill sulle linee da cui sei uscito', () => {
    const p = proponiMissione({ ...base, problemaPrincipale: 'occasione', deviazioni: [{ partita_id: 1, mossa: 'Nf6', attesa: 'a6', linee: ['n-spagnola'] }] }, []);
    expect(p.regole.drill).toEqual(['n-spagnola']);
    expect(p.regole.puzzle).toBe(20);
  });
});

describe('bilancio su partite vere (pglite)', () => {
  it('trova il pezzo in presa, propone la missione e conta i finali fatti durante la missione', async () => {
    const id = await creaMissione({
      titolo: 'Prova',
      descrizione: 'Missione di prova',
      regole: { linee: REPERTORIO.map((l) => l.id), cadenze: ['rapid'], partite: 2, finali: ['donna-re'] },
    });
    await new Promise((r) => setTimeout(r, 20));
    const dopo = new Date().toISOString(); // dopo l'inizio della missione, prima della chiusura
    const pid = (await salvaPartita({ fonte: 'chesscom', url: 'f1', cadenza: 'rapid', coloreMio: 'b', giocataIl: dopo, pgn: FORCHETTA }))!;
    await salvaReview(pid, await review(FORCHETTA));
    const m = (await missioneAttiva())!;
    expect(m.id).toBe(id);
    const b = await bilancioMissione(m);
    expect(b.perTipo.find((t) => t.tipo === 'regalo')?.n).toBe(1);
    expect(b.problemaPrincipale).toBe('regalo');
    expect(b.proposta.regole.puzzle).toBe(15);

    let av = await avanzamento(m);
    expect(av.obiettivi.find((o) => o.testo.includes('Donna e Re'))?.ok).toBeNull();
    await registraFinale('donna-re', true, 9);
    av = await avanzamento(m);
    expect(av.obiettivi.find((o) => o.testo.includes('Donna e Re'))?.ok).toBe(true);

    await chiudiMissione(id, 'completata');
    const nuova = await accettaProposta();
    expect((await missioneAttiva())!.id).toBe(nuova);
    expect((await missioneAttiva())!.titolo).toMatch(/Controlla prima di muovere/);
  }, 90000);
});
