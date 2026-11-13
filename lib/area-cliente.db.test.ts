// Area cliente su Postgres vero (PGlite): fatture e lavori di una società archiviati su un'altra scheda.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Sql } from '@/test/db-pglite';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import dbSql from '@/lib/db';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { creaPreventivi } from '@/test/db-pglite';
import { caricaArea, fatturaDelCliente } from './area-cliente';

const sql = dbSql as unknown as Sql;
const ids: Record<string, number> = {};

const xml = (descrizione: string) =>
  `<FatturaElettronica><FatturaElettronicaHeader><CedentePrestatore/><CessionarioCommittente/></FatturaElettronicaHeader><FatturaElettronicaBody><DatiBeniServizi><DettaglioLinee><NumeroLinea>1</NumeroLinea><Descrizione>${descrizione}</Descrizione><PrezzoTotale>300</PrezzoTotale></DettaglioLinee></DatiBeniServizi></FatturaElettronicaBody></FatturaElettronica>`;

beforeAll(async () => {
  await creaPreventivi(sql);
  await ensureFattureXmlSchema();
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS lavoro_inizio DATE`;
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS lavoro_fine DATE`;
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS scadenza DATE`;
  const ins = async (nome: string, piva: string | null) =>
    (await sql`INSERT INTO clienti (nome, email, piva) VALUES (${nome}, ${nome + '@example.com'}, ${piva}) RETURNING id`)[0].id as number;
  ids.claudio = await ins('Claudio', 'IT08174080724');
  ids.ciccolella = await ins('Ciccolella', null);
  ids.altro = await ins('Altro', 'IT99999999999');

  // La società di Claudio è (per errore) collegata alla scheda di un altro cliente.
  ids.cream = (await sql`INSERT INTO intestatari (chiave, denominazione, piva, cliente_id) VALUES ('cream', 'CREAM SRLS', 'IT08174080724', ${ids.ciccolella}) RETURNING id`)[0].id;

  const prev = async (token: string, oggetto: string, cliente: number | null, piva?: string) =>
    (await sql`INSERT INTO preventivi (token, cliente_nome, cliente_email, oggetto, totale, stato, cliente_id, meta)
               VALUES (${token}, 'x', 'x@example.com', ${oggetto}, 1000, 'accettato', ${cliente}, ${piva ? JSON.stringify({ cliente: { piva } }) : null})
               RETURNING id`)[0].id as number;
  ids.migrazione = await prev('a', 'Migrazione', ids.ciccolella);
  ids.sitoCream = await prev('b', 'Sito web di Cream', null, '08174080724');
  ids.altroPrev = await prev('c', 'Lavoro di un altro', ids.altro, 'IT99999999999');

  const fatt = async (numero: string, cliente: number | null, intestatario: number | null, preventivo: number | null, x: string | null) =>
    (await sql`INSERT INTO fatture (cliente_id, numero, importo, data, anno, stato, intestatario_id, preventivo_id, xml)
               VALUES (${cliente}, ${numero}, 300, '2026-09-18', 2026, 'pagata', ${intestatario}, ${preventivo}, ${x})
               RETURNING id`)[0].id as number;
  ids.f24 = await fatt('24', ids.ciccolella, ids.cream, ids.migrazione, null);
  ids.f19 = await fatt('19', null, ids.cream, null, xml('Assistenza tecnica Shopify'));
  ids.fAltro = await fatt('7', ids.altro, null, null, null);
});

describe('area cliente', () => {
  it('mostra a Claudio le fatture e i lavori intestati alla sua P.IVA, anche su altre schede', async () => {
    const d = (await caricaArea(ids.claudio, '2026-11-13'))!;
    expect(d.fatture.map((f) => f.numero).sort()).toEqual(['19', '24']);
    expect(d.preventivi.map((p) => p.oggetto).sort()).toEqual(['Migrazione', 'Sito web di Cream']);
    const f19 = d.fatture.find((f) => f.numero === '19')!;
    expect(f19.descrizione).toBe('Assistenza tecnica Shopify');
    expect(f19.pdf_url).toBe(`/api/fatture/${ids.f19}/pdf`);
  });

  it('non mostra niente di clienti con un\'altra P.IVA', async () => {
    const d = (await caricaArea(ids.claudio, '2026-11-13'))!;
    expect(d.fatture.some((f) => f.id === ids.fAltro)).toBe(false);
    expect(await fatturaDelCliente(ids.fAltro, ids.claudio)).toBe(false);
    expect(await fatturaDelCliente(ids.f19, ids.claudio)).toBe(true);
    expect(await fatturaDelCliente(ids.f19, ids.altro)).toBe(false);
  });

  it('un cliente senza P.IVA vede solo le sue schede', async () => {
    const d = (await caricaArea(ids.ciccolella, '2026-11-13'))!;
    expect(d.preventivi.map((p) => p.oggetto)).toEqual(['Migrazione']);
    // la società collegata alla sua scheda porta con sé le fatture
    expect(d.fatture.map((f) => f.numero).sort()).toEqual(['19', '24']);
  });
});
