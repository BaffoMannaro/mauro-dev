// Canone ore su Postgres vero (PGlite): schema, interventi, richieste, pagamenti in scadenza.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Sql } from '@/test/db-pglite';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import dbSql from '@/lib/db';
import { creaPreventivi } from '@/test/db-pglite';
import {
  datiCanone,
  decidiRichiesta,
  ensureCanoneSchema,
  ErroreCanone,
  eliminaIntervento,
  impostaCanone,
  nuovaRichiesta,
  registraIntervento,
  salvaLavoro,
  stimaRichiesta,
} from './canone';

const sql = dbSql as unknown as Sql;
let cid: number;

beforeAll(async () => {
  await creaPreventivi(sql);
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS cliente_id INTEGER`;
  await ensureCanoneSchema();
  const [c] = await sql`INSERT INTO clienti (nome, email) VALUES ('Claudio', 'c@example.com') RETURNING id`;
  cid = c.id;
});

describe('canone', () => {
  it('imposta il canone e calcola il mese con gli interventi', async () => {
    await impostaCanone(cid, { ore_mese: 8, prezzo_mese: 320, tariffa_extra: 50, inizio: '2026-11-13', siti: ['Cokito'] });
    // Riscrivere non duplica e mantiene i siti se non passati.
    const c = await impostaCanone(cid, { ore_mese: 8, prezzo_mese: 320, tariffa_extra: 50, inizio: '2026-11-01' });
    expect(c).toMatchObject({ inizio: '2026-11-01', siti: ['Cokito'], riporto_mesi: 1 });

    const i = await registraIntervento(cid, { data: '2026-11-12', minuti: 240, descrizione: 'Extra Pop', sito: 'Ciccolella' });
    await registraIntervento(cid, { data: '2026-11-13', minuti: 60, descrizione: 'Slide Black Friday', sito: 'Cokito', fuori_canone: true });
    const dati = await datiCanone(cid, '2026-11-20');
    expect(dati.corrente).toMatchObject({ usate: 240, rimaste: 240, fuori_canone: 60 });
    expect(dati.interventi).toHaveLength(2);
    expect(dati.pagamenti.find((p) => p.tipo === 'canone')?.importo).toBe(320);

    await eliminaIntervento(cid, i.id);
    expect((await datiCanone(cid, '2026-11-20')).corrente?.usate).toBe(0);
    await expect(eliminaIntervento(cid + 99, i.id)).rejects.toBeInstanceOf(ErroreCanone);
  });

  it('richiesta: nuova, stima, approvazione', async () => {
    const r = await nuovaRichiesta(cid, { testo: 'Cambiare il banner', sito: 'Cokito' });
    expect(r.stato).toBe('nuova');
    await expect(decidiRichiesta(cid, r.id, 'approva')).rejects.toBeInstanceOf(ErroreCanone);
    const s = await stimaRichiesta(cid, r.id, { ore_stimate: 1.5, risposta: 'Ok', consegna_prevista: '2026-11-20' });
    expect(s).toMatchObject({ stato: 'stimata', ore_stimate: 1.5, consegna_prevista: '2026-11-20' });
    expect((await decidiRichiesta(cid, r.id, 'approva')).stato).toBe('approvata');
  });

  it('lavori: crea, aggiorna e conta le ore collegate', async () => {
    const id = await salvaLavoro(cid, { titolo: 'Sito Cream', stato: 'in_corso', inizio: '2026-11-01', consegna_prevista: '2026-12-15', ore_stimate: 20 });
    await registraIntervento(cid, { data: '2026-11-14', minuti: 90, descrizione: 'Home', lavoro_id: id, fuori_canone: true });
    await salvaLavoro(cid, { id, stato: 'attesa_cliente', attesa_cliente: 'Testi della home' });
    const [l] = (await datiCanone(cid, '2026-11-20')).lavori;
    expect(l).toMatchObject({ titolo: 'Sito Cream', stato: 'attesa_cliente', minuti_usati: 90, consegna_prevista: '2026-12-15' });
  });

  it('tranche non pagate dei preventivi, senza ripetere quelle già fatturate', async () => {
    const [p] = await sql`
      INSERT INTO preventivi (token, cliente_nome, cliente_email, oggetto, totale, stato, cliente_id, tranches_stato)
      VALUES ('t1', 'Claudio', 'c@example.com', 'SilkyBe', 2000, 'accettato', ${cid},
              ${JSON.stringify([{ descrizione: 'Acconto', percentuale: 50, pagato: false }, { descrizione: 'Saldo', percentuale: 50, pagato: false }])})
      RETURNING id
    `;
    let tranche = (await datiCanone(cid, '2026-11-20')).pagamenti.filter((x) => x.tipo === 'tranche');
    expect(tranche.map((t) => t.importo)).toEqual([1000, 1000]);
    await sql`INSERT INTO fatture (cliente_id, preventivo_id, numero, importo, data, stato) VALUES (${cid}, ${p.id}, '9', 1000, '2026-11-10', 'da_pagare')`;
    const dati = await datiCanone(cid, '2026-11-20');
    tranche = dati.pagamenti.filter((x) => x.tipo === 'tranche');
    expect(tranche.map((t) => t.descrizione)).toEqual(['SilkyBe: Saldo (50%)']);
    expect(dati.pagamenti.find((x) => x.tipo === 'fattura')?.importo).toBe(1000);
  });
});
