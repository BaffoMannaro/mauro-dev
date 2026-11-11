// Pagamenti parziali su un Postgres vero (PGlite): migrazione, validazione della somma,
// stato derivato, compatibilità di aggiorna_stato_fattura, tranche e riepilogo del preventivo.
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Sql } from '@/test/db-pglite';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import dbSql from '@/lib/db';
import { ensureFattureXmlSchema, migraPagamentiFattura } from '@/lib/schema';
import {
  eliminaPagamento,
  ErrorePagamento,
  fattureDelPreventivo,
  impostaStatoFattura,
  registraPagamento,
  statoPagamenti,
} from './server';
import { registraStrumenti } from '@/lib/mcp/tools';
import { creaPreventivi } from '@/test/db-pglite';

const sql = dbSql as unknown as Sql;

async function nuovaFattura(importo: number | null, extra: { stato?: string; pagata_il?: string | null; data?: string; preventivo_id?: number } = {}) {
  const [r] = await sql`
    INSERT INTO fatture (cliente_id, numero, importo, data, anno, stato, pagata_il, preventivo_id, xml, cliente_nome)
    VALUES (NULL, ${String(Math.random()).slice(2, 8)}, ${importo}, ${extra.data ?? '2026-12-15'}, 2026,
            ${extra.stato ?? 'da_pagare'}, ${extra.pagata_il ?? null}, ${extra.preventivo_id ?? null}, '<xml/>', 'Cliente Test')
    RETURNING id
  `;
  return r.id as number;
}

const pagamentiDi = (id: number) =>
  sql`SELECT to_char(data, 'YYYY-MM-DD') AS data, importo, nota FROM pagamenti_fattura WHERE fattura_id = ${id} ORDER BY data, id`;
const statoDi = async (id: number) =>
  (await sql`SELECT stato, to_char(pagata_il, 'YYYY-MM-DD') AS pagata_il FROM fatture WHERE id = ${id}`)[0];

beforeAll(async () => {
  await creaPreventivi(sql);
  await ensureFattureXmlSchema();
});

describe('migrazione dei dati esistenti', () => {
  beforeEach(async () => {
    await sql`DELETE FROM fatture`;
  });

  it('una fattura "pagata" riceve un pagamento pari al totale alla data pagata_il; le da_pagare nessuno', async () => {
    // Righe come le lasciava il codice precedente (stato impostato a mano).
    const pagata = await nuovaFattura(1040, { stato: 'pagata', pagata_il: '2027-01-10' });
    const senzaGiorno = await nuovaFattura(520.5, { stato: 'pagata', pagata_il: null, data: '2026-09-01' });
    const aperta = await nuovaFattura(300);

    await migraPagamentiFattura();

    expect(await pagamentiDi(pagata)).toEqual([{ data: '2027-01-10', importo: 104000, nota: expect.any(String) }]);
    // Segnata pagata prima di ottobre 2026 senza giorno: vale la data fattura.
    expect(await pagamentiDi(senzaGiorno)).toEqual([{ data: '2026-09-01', importo: 52050, nota: expect.any(String) }]);
    expect(await statoDi(senzaGiorno)).toEqual({ stato: 'pagata', pagata_il: '2026-09-01' });
    expect(await pagamentiDi(aperta)).toEqual([]);
    expect(await statoDi(aperta)).toEqual({ stato: 'da_pagare', pagata_il: null });
  });

  it('è idempotente: rilanciarla non duplica i pagamenti', async () => {
    const id = await nuovaFattura(1040, { stato: 'pagata', pagata_il: '2027-01-10' });
    await migraPagamentiFattura();
    await migraPagamentiFattura();
    await migraPagamentiFattura();
    expect(await pagamentiDi(id)).toHaveLength(1);
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM pagamenti_fattura`;
    expect(n).toBe(1);
  });

  it('eliminare la fattura elimina i suoi pagamenti (cascade)', async () => {
    const id = await nuovaFattura(100, { stato: 'pagata', pagata_il: '2026-12-20' });
    await migraPagamentiFattura();
    await sql`DELETE FROM fatture WHERE id = ${id}`;
    expect(await pagamentiDi(id)).toEqual([]);
  });
});

describe('registrazione e stato derivato', () => {
  it('acconto → parziale, saldo → pagata con pagata_il = ultimo pagamento', async () => {
    const id = await nuovaFattura(1040);
    const s1 = await registraPagamento(id, { importo: 400, data: '2026-12-20', metodo: 'bonifico', nota: '1ª rata' });
    expect(s1).toMatchObject({ stato: 'parziale', incassato: 400, residuo: 640, pagata_il: null });
    expect(await statoDi(id)).toEqual({ stato: 'parziale', pagata_il: null });

    const s2 = await registraPagamento(id, { importo: 640, data: '2027-02-10' });
    expect(s2).toMatchObject({ stato: 'pagata', incassato: 1040, residuo: 0, pagata_il: '2027-02-10' });
    expect(s2.pagamenti.map((p) => [p.data, p.importo, p.metodo])).toEqual([['2026-12-20', 400, 'bonifico'], ['2027-02-10', 640, null]]);

    // Eliminare un pagamento riapre la fattura.
    const tolto = await eliminaPagamento(s2.pagamenti[1].id);
    expect(tolto).toMatchObject({ stato: 'parziale', residuo: 640, pagata_il: null });
  });

  it('la somma non può superare il totale: errore chiaro col residuo, nessun pagamento salvato', async () => {
    const id = await nuovaFattura(1040);
    await registraPagamento(id, { importo: 1000, data: '2027-01-05' });
    await expect(registraPagamento(id, { importo: 50, data: '2027-01-06' })).rejects.toThrow(/residuo.*€40,00/);
    await expect(registraPagamento(id, { importo: 0, data: '2027-01-06' })).rejects.toBeInstanceOf(ErrorePagamento);
    await expect(registraPagamento(id, { importo: 10, data: '2027-13-01' })).rejects.toThrow(/Data/);
    expect(await pagamentiDi(id)).toHaveLength(1);
    // Il vincolo regge anche a livello di DB.
    await expect(sql`INSERT INTO pagamenti_fattura (fattura_id, data, importo) VALUES (${id}, '2027-01-01', 0)`).rejects.toThrow();
  });
});

describe('compatibilità di aggiorna_stato_fattura (impostaStatoFattura)', () => {
  it('"pagata" registra un pagamento pari al residuo alla data pagata_il', async () => {
    const id = await nuovaFattura(1040);
    await registraPagamento(id, { importo: 300, data: '2026-12-20' });
    const s = await impostaStatoFattura(id, 'pagata', '2027-03-01');
    expect(s).toMatchObject({ stato: 'pagata', incassato: 1040, residuo: 0, pagata_il: '2027-03-01' });
    expect((await pagamentiDi(id)).map((p) => [p.data, p.importo])).toEqual([['2026-12-20', 30000], ['2027-03-01', 74000]]);
  });

  it('"pagata" su fattura senza pagamenti = un pagamento pari al totale; ripeterlo con altra data corregge la data', async () => {
    const id = await nuovaFattura(500);
    await impostaStatoFattura(id, 'pagata', '2027-01-15');
    expect((await pagamentiDi(id)).map((p) => [p.data, p.importo])).toEqual([['2027-01-15', 50000]]);
    await impostaStatoFattura(id, 'pagata', '2027-01-16');
    expect((await pagamentiDi(id)).map((p) => [p.data, p.importo])).toEqual([['2027-01-16', 50000]]);
    expect(await statoDi(id)).toEqual({ stato: 'pagata', pagata_il: '2027-01-16' });
  });

  it('"da_pagare" elimina tutti i pagamenti della fattura', async () => {
    const id = await nuovaFattura(1040);
    await registraPagamento(id, { importo: 300, data: '2026-12-20' });
    await registraPagamento(id, { importo: 200, data: '2027-01-20' });
    const s = await impostaStatoFattura(id, 'da_pagare');
    expect(s).toMatchObject({ stato: 'da_pagare', incassato: 0, residuo: 1040, pagamenti: [] });
    expect(await pagamentiDi(id)).toEqual([]);
  });

  it('fattura inesistente → null', async () => {
    expect(await impostaStatoFattura(999999, 'pagata', '2027-01-01')).toBeNull();
    expect(await statoPagamenti(999999)).toBeNull();
  });
});

describe('preventivo collegato', () => {
  it('riepilogo fatturazione e tranche seguono i pagamenti parziali', async () => {
    const [p] = await sql`
      INSERT INTO preventivi (token, cliente_nome, cliente_email, oggetto, totale, stato, meta)
      VALUES (${'t' + Date.now()}, 'Cliente', 'c@example.com', 'Sito', 2000, 'accettato',
              ${JSON.stringify({ sezioni: { tranches: [{ descrizione: 'Acconto', percentuale: 50 }, { descrizione: 'Saldo', percentuale: 50 }] } })}::jsonb)
      RETURNING id
    `;
    const id = await nuovaFattura(2000, { preventivo_id: p.id });
    await registraPagamento(id, { importo: 1000, data: '2027-01-10' });

    const { fatture, riepilogo } = await fattureDelPreventivo(p.id);
    expect(riepilogo).toMatchObject({ fatturato: 2000, incassato: 1000, da_incassare: 1000 });
    expect(fatture[0]).toMatchObject({ stato: 'parziale', incassato: 1000, residuo: 1000 });

    const [{ tranches_stato: t }] = await sql`SELECT tranches_stato FROM preventivi WHERE id = ${p.id}`;
    expect(t.map((x: { pagato: boolean; data_pagamento?: string }) => [x.pagato, x.data_pagamento ?? null])).toEqual([
      [true, '2027-01-10'],
      [false, null],
    ]);
  });
});

describe('tool MCP', () => {
  type Handler = (args: Record<string, unknown>) => Promise<{ content: { text: string }[]; isError?: boolean }>;
  const tools = new Map<string, { config: { description: string }; handler: Handler }>();

  beforeAll(() => {
    const server = {
      registerTool: (name: string, config: { description: string }, handler: Handler) => tools.set(name, { config, handler }),
      registerPrompt: () => undefined,
      registerResource: () => undefined,
    };
    registraStrumenti(server as never);
  });
  const chiama = async (nome: string, args: Record<string, unknown>) => {
    const r = await tools.get(nome)!.handler(args);
    return { errore: !!r.isError, dati: r.isError ? r.content[0].text : JSON.parse(r.content[0].text) };
  };

  it('le descrizioni chiedono conferma e avvisano che "da_pagare" elimina i pagamenti', () => {
    expect(tools.get('registra_pagamento')!.config.description).toMatch(/conferma/);
    expect(tools.get('elimina_pagamento')!.config.description).toMatch(/conferma/);
    expect(tools.get('aggiorna_stato_fattura')!.config.description).toMatch(/ELIMINA TUTTI i pagamenti/);
  });

  it('registra_pagamento, lista_fatture (filtro parziale), elimina_pagamento, aggiorna_stato_fattura', async () => {
    await sql`DELETE FROM fatture`;
    const id = await nuovaFattura(1040);

    const r1 = await chiama('registra_pagamento', { fattura_id: id, importo: 400, data: '2026-12-20', metodo: 'bonifico' });
    expect(r1.dati).toMatchObject({ stato: 'parziale', incassato: 400, residuo: 640, fattura: { id, totale: 1040 } });

    const troppo = await chiama('registra_pagamento', { fattura_id: id, importo: 700, data: '2027-01-01' });
    expect(troppo.errore).toBe(true);
    expect(troppo.dati).toMatch(/€640,00/);

    const lista = await chiama('lista_fatture', { stato: 'parziale' });
    expect(lista.dati).toHaveLength(1);
    expect(lista.dati[0]).toMatchObject({ id, stato: 'parziale', incassato: 400, residuo: 640 });
    expect(lista.dati[0].pagamenti).toEqual([{ id: r1.dati.pagamenti[0].id, data: '2026-12-20', importo: 400, metodo: 'bonifico' }]);

    const saldo = await chiama('aggiorna_stato_fattura', { id, stato: 'pagata', pagata_il: '2027-02-10' });
    expect(saldo.dati).toMatchObject({ stato: 'pagata', residuo: 0, pagata_il: '2027-02-10' });
    expect(saldo.dati.pagamenti).toHaveLength(2);

    const tolto = await chiama('elimina_pagamento', { pagamento_id: saldo.dati.pagamenti[1].id });
    expect(tolto.dati).toMatchObject({ stato: 'parziale', residuo: 640 });

    const azzera = await chiama('aggiorna_stato_fattura', { id, stato: 'da_pagare' });
    expect(azzera.dati).toMatchObject({ stato: 'da_pagare', pagamenti: [], residuo: 1040 });
  });
});
