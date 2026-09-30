import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import sql from '@/lib/db';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { parseFattura, extractXml } from '@/lib/fattura/parse';
import { salvaFattura, archivioSelect } from '@/lib/fattura/server';
import { calcolaAnalisi, SOGLIA_FORFETTARIO, type RigaAnalisi } from '@/lib/fattura/analisi';
import {
  applicaModello,
  daJson,
  inserisciPreventivo,
  leggiModello,
  modificaPreventivo,
  salvaModello,
  type PreventivoJson,
} from '@/lib/preventivi';
import { baseApp, baseSito, linkDownloadFattura } from './oauth';

export const ISTRUZIONI = `Gestionale di Mauro Altamura (Mauro Dev, sviluppatore web in regime forfettario).
- Preventivi: prima di crearne uno chiama leggi_modello_preventivo e segui le sue linee_guida; i campi che non indichi vengono completati con i predefiniti del modello. Mostra sempre il link pubblico e il link PDF restituiti.
- Fatture: l'utente carica in chat l'XML FatturaPA dell'Agenzia delle Entrate; passa il testo XML integrale a importa_fattura. Il PDF brandizzato si scarica dal link restituito (valido 24 ore).
- Importi in euro, date in formato YYYY-MM-DD. Rispondi in italiano.`;

// ─── Helper ──────────────────────────────────────────────────

const testo = (data: unknown) => ({
  content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
});

const errore = (msg: string) => ({ content: [{ type: 'text' as const, text: msg }], isError: true });

const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : d ? String(d).slice(0, 10) : null);

const linkPreventivo = (token: string) => ({
  link_pubblico: `${baseSito()}/p/${token}`,
  link_pdf: `${baseSito()}/api/p/${token}/pdf`,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function riepilogoPreventivo(p: any) {
  return {
    id: p.id,
    oggetto: p.oggetto,
    cliente: p.cliente_azienda || p.cliente_nome,
    email: p.cliente_email,
    totale: Number(p.totale),
    iva: p.iva,
    stato: p.stato,
    scadenza: iso(p.scadenza),
    creato_il: iso(p.created_at),
    accettato_il: iso(p.accettato_at),
    ...linkPreventivo(p.token),
  };
}

// ─── Schemi ──────────────────────────────────────────────────

const voceSchema = z.object({
  descrizione: z.string(),
  quantita: z.number().positive(),
  prezzo: z.number().describe('Prezzo unitario in euro'),
});

const sezioniSchema = z.object({
  intro: z.string().optional().describe('Paragrafo di apertura rivolto al cliente'),
  descrizione: z.string().optional().describe('Descrizione del progetto (può contenere elenchi con \\n)'),
  voci: z.object({ modalita: z.string().optional(), items: z.array(voceSchema).min(1) }).optional(),
  tranches: z.array(z.object({ descrizione: z.string(), percentuale: z.number() })).optional(),
  tempi: z.string().optional(),
  garanzia: z.string().optional(),
  esclusioni: z.array(z.string()).optional(),
  manutenzione: z.object({ descrizione: z.string(), prezzo: z.number().describe('Canone mensile') }).optional(),
  fasi_successive: z.string().optional(),
  note: z.string().optional(),
});

const clienteSchema = z.object({
  nome: z.string(),
  email: z.string(),
  azienda: z.string().optional(),
  piva: z.string().optional(),
  telefono: z.string().optional(),
});

const testataSchema = z.object({
  oggetto: z.string(),
  data: z.string().optional().describe('Data leggibile, es. "30 Settembre 2026"'),
  scadenza: z.string().optional().describe('YYYY-MM-DD'),
  iva: z.boolean().optional().describe('true = IVA 22% esposta; in forfettario di norma false'),
  modalita_pagamento: z.string().optional(),
  schema_pagamento: z.string().optional(),
});

// ─── Registrazione ───────────────────────────────────────────

export function registraStrumenti(server: McpServer) {
  const sola = { readOnlyHint: true, openWorldHint: false };

  // ── Preventivi ──

  server.registerTool(
    'lista_preventivi',
    {
      title: 'Elenca preventivi',
      description: 'Elenca i preventivi, dal più recente. Filtri opzionali per stato e testo (cliente o oggetto).',
      inputSchema: z.object({
        stato: z.enum(['inviato', 'accettato', 'rifiutato', 'archiviato']).optional(),
        cerca: z.string().optional(),
        limite: z.number().int().min(1).max(200).default(30),
      }),
      annotations: sola,
    },
    async ({ stato, cerca, limite }) => {
      const q = cerca ? `%${cerca}%` : null;
      const rows = await sql`
        SELECT * FROM preventivi
        WHERE (${stato ?? null}::text IS NULL OR stato = ${stato ?? null})
          AND (${q}::text IS NULL OR cliente_nome ILIKE ${q} OR cliente_azienda ILIKE ${q} OR oggetto ILIKE ${q})
        ORDER BY created_at DESC LIMIT ${limite}
      `;
      return testo(rows.map(riepilogoPreventivo));
    }
  );

  server.registerTool(
    'leggi_preventivo',
    {
      title: 'Leggi preventivo',
      description: 'Restituisce un preventivo completo (tutte le sezioni in formato JSON) per id.',
      inputSchema: z.object({ id: z.number().int() }),
      annotations: sola,
    },
    async ({ id }) => {
      const [p] = await sql`SELECT * FROM preventivi WHERE id = ${id}`;
      if (!p) return errore(`Preventivo ${id} non trovato`);
      return testo({ ...riepilogoPreventivo(p), dati: p.meta, tranches_stato: p.tranches_stato });
    }
  );

  server.registerTool(
    'crea_preventivo',
    {
      title: 'Crea preventivo',
      description:
        'Crea un nuovo preventivo e restituisce il link pubblico da mandare al cliente e il link al PDF. ' +
        'Chiama prima leggi_modello_preventivo: i campi omessi vengono completati dal modello.',
      inputSchema: z.object({
        cliente: clienteSchema,
        preventivo: testataSchema,
        sezioni: sezioniSchema.extend({ voci: z.object({ modalita: z.string().optional(), items: z.array(voceSchema).min(1) }) }),
        usa_modello: z.boolean().default(true).describe('Completa i campi mancanti con i predefiniti del modello'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ usa_modello, ...dati }) => {
      try {
        const completo = usa_modello ? applicaModello(dati as PreventivoJson, await leggiModello()) : (dati as PreventivoJson);
        const p = await inserisciPreventivo(daJson(completo));
        return testo({ creato: true, ...riepilogoPreventivo(p), dati: completo });
      } catch (e) {
        return errore((e as Error).message);
      }
    }
  );

  server.registerTool(
    'modifica_preventivo',
    {
      title: 'Modifica preventivo',
      description:
        'Modifica un preventivo esistente. Passa solo ciò che cambia: le sezioni indicate sostituiscono quelle attuali ' +
        '(per le voci passa l’elenco completo aggiornato), il totale viene ricalcolato.',
      inputSchema: z.object({
        id: z.number().int(),
        cliente: clienteSchema.partial().optional(),
        preventivo: testataSchema.partial().optional(),
        sezioni: sezioniSchema.optional(),
        stato: z.enum(['inviato', 'accettato', 'rifiutato', 'archiviato']).optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, ...modifiche }) => {
      try {
        const p = await modificaPreventivo(id, modifiche);
        return testo({ aggiornato: true, ...riepilogoPreventivo(p), dati: p.meta });
      } catch (e) {
        return errore((e as Error).message);
      }
    }
  );

  // ── Modello dei preventivi ──

  server.registerTool(
    'leggi_modello_preventivo',
    {
      title: 'Leggi modello preventivi',
      description: 'Restituisce linee guida di scrittura e valori predefiniti usati per creare i preventivi.',
      inputSchema: z.object({}),
      annotations: sola,
    },
    async () => {
      const m = await leggiModello();
      return testo(Object.keys(m).length ? m : { vuoto: true, suggerimento: 'Nessun modello: usa aggiorna_modello_preventivo per definirlo.' });
    }
  );

  server.registerTool(
    'aggiorna_modello_preventivo',
    {
      title: 'Aggiorna modello preventivi',
      description:
        'Cambia il modo in cui vengono creati i preventivi: linee guida di tono/struttura, giorni di validità e ' +
        'sezioni predefinite (tranches, garanzia, esclusioni, tempi, manutenzione...). ' +
        'I campi passati sostituiscono quelli attuali; gli altri restano. Leggi prima il modello attuale.',
      inputSchema: z.object({
        linee_guida: z.string().optional(),
        validita_giorni: z.number().int().min(1).max(365).optional(),
        preventivo: testataSchema.omit({ oggetto: true, data: true, scadenza: true }).partial().optional(),
        sezioni: sezioniSchema.omit({ voci: true }).partial().optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async (patch) => {
      const attuale = await leggiModello();
      const nuovo = {
        ...attuale,
        ...(patch.linee_guida !== undefined && { linee_guida: patch.linee_guida }),
        ...(patch.validita_giorni !== undefined && { validita_giorni: patch.validita_giorni }),
        preventivo: { ...attuale.preventivo, ...patch.preventivo },
        sezioni: { ...attuale.sezioni, ...patch.sezioni },
      };
      await salvaModello(nuovo);
      return testo({ aggiornato: true, modello: nuovo });
    }
  );

  // ── Fatture ──

  server.registerTool(
    'importa_fattura',
    {
      title: 'Importa fattura XML',
      description:
        'Legge una fattura elettronica (testo XML FatturaPA dell’Agenzia delle Entrate), la salva in archivio ' +
        '(o la aggiorna se numero+anno esistono) e restituisce riepilogo e link al PDF brandizzato.',
      inputSchema: z.object({
        xml: z.string().min(50).describe('Contenuto integrale del file .xml'),
        salva: z.boolean().default(true).describe('false = solo lettura, non salva in archivio'),
        con_logo: z.boolean().default(true).describe('Logo nell’intestazione del PDF'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ xml, salva, con_logo }) => {
      let f;
      try {
        xml = extractXml(new TextEncoder().encode(xml));
        f = parseFattura(xml);
      } catch (e) {
        return errore((e as Error).message);
      }
      const riepilogo = {
        numero: f.numero,
        data: f.data,
        cliente: f.committente.nome,
        piva_cliente: f.committente.piva,
        righe: f.linee.map((l) => ({ descrizione: l.descrizione, importo: l.prezzoTotale })),
        contributo_inps: f.casse.reduce((s, c) => s + c.importo, 0),
        totale: f.totaleDocumento,
        scadenza: f.pagamenti[0]?.scadenza ?? null,
      };
      if (!salva) return testo({ salvata: false, ...riepilogo });

      await ensureFattureXmlSchema();
      const row = await salvaFattura(f, xml, con_logo);
      return testo({
        salvata: true,
        id: row.id,
        cliente_collegato: row.cliente_id != null,
        stato: row.stato,
        ...riepilogo,
        link_pdf: await linkDownloadFattura(row.id),
      });
    }
  );

  server.registerTool(
    'lista_fatture',
    {
      title: 'Elenca fatture',
      description: 'Elenca le fatture in archivio, dalla più recente. Filtri per anno, stato e cliente.',
      inputSchema: z.object({
        anno: z.number().int().optional(),
        stato: z.enum(['pagata', 'da_pagare']).optional(),
        cerca: z.string().optional().describe('Nome cliente o numero'),
      }),
      annotations: sola,
    },
    async ({ anno, stato, cerca }) => {
      await ensureFattureXmlSchema();
      const q = cerca ? `%${cerca}%` : null;
      const rows = await sql`
        ${archivioSelect()}
        WHERE xml IS NOT NULL
          AND (${anno ?? null}::int IS NULL OR anno = ${anno ?? null})
          AND (${stato ?? null}::text IS NULL OR stato = ${stato ?? null})
          AND (${q}::text IS NULL OR cliente_nome ILIKE ${q} OR numero ILIKE ${q})
        ORDER BY data DESC, id DESC
      `;
      return testo(
        rows.map((r) => ({
          id: r.id, numero: r.numero, data: r.data, cliente: r.cliente_nome,
          importo: r.importo, stato: r.stato, cliente_collegato: r.cliente_id != null,
        }))
      );
    }
  );

  server.registerTool(
    'pdf_fattura',
    {
      title: 'PDF fattura',
      description: 'Restituisce il link per scaricare il PDF brandizzato di una fattura in archivio (valido 24 ore).',
      inputSchema: z.object({
        id: z.number().int(),
        con_logo: z.boolean().optional().describe('Se indicato, aggiorna anche la preferenza logo della fattura'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, con_logo }) => {
      await ensureFattureXmlSchema();
      const [r] = await sql`SELECT id, numero, cliente_nome FROM fatture WHERE id = ${id} AND xml IS NOT NULL`;
      if (!r) return errore(`Fattura ${id} non trovata`);
      if (con_logo !== undefined) await sql`UPDATE fatture SET con_logo = ${con_logo} WHERE id = ${id}`;
      return testo({ id, numero: r.numero, cliente: r.cliente_nome, link_pdf: await linkDownloadFattura(id) });
    }
  );

  server.registerTool(
    'aggiorna_stato_fattura',
    {
      title: 'Segna fattura pagata / da pagare',
      description: 'Imposta lo stato di pagamento di una fattura in archivio.',
      inputSchema: z.object({ id: z.number().int(), stato: z.enum(['pagata', 'da_pagare']) }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, stato }) => {
      await ensureFattureXmlSchema();
      const rows = await sql`UPDATE fatture SET stato = ${stato}, updated_at = NOW() WHERE id = ${id} RETURNING id`;
      return rows.length ? testo({ id, stato }) : errore(`Fattura ${id} non trovata`);
    }
  );

  // ── Statistiche e clienti ──

  server.registerTool(
    'statistiche',
    {
      title: 'Statistiche e analisi',
      description:
        'Analisi di un anno: fatturato (vs anno precedente), incassato/da incassare, soglia forfettario 85.000 €, ' +
        'andamento mensile, clienti principali, pipeline dei preventivi e costo abbonamenti.',
      inputSchema: z.object({ anno: z.number().int().optional().describe('Default: anno corrente') }),
      annotations: sola,
    },
    async ({ anno }) => {
      await ensureFattureXmlSchema();
      const a = anno ?? new Date().getFullYear();

      const archivio = (await sql`${archivioSelect()} WHERE xml IS NOT NULL AND anno IN (${a}, ${a - 1})`) as RigaAnalisi[];
      const s = calcolaAnalisi(archivio, a);

      const prev = await sql`
        SELECT stato, count(*)::int AS n, coalesce(sum(totale), 0)::float8 AS totale
        FROM preventivi WHERE extract(year FROM created_at) = ${a} GROUP BY stato
      `;
      const per = Object.fromEntries(prev.map((r) => [r.stato, { n: r.n, totale: r.totale }]));
      const decisi = (per.accettato?.n ?? 0) + (per.rifiutato?.n ?? 0);

      const [abb] = await sql`
        SELECT coalesce(sum(CASE WHEN cadenza = 'mensile' THEN cifra WHEN cadenza = 'annuale' THEN cifra / 12 ELSE 0 END), 0)::float8 AS mensile
        FROM abbonamenti WHERE attivo = true
      `;

      return testo({
        anno: a,
        fatture: {
          fatturato: s.fatturato,
          fatturato_anno_precedente: s.fatturatoPrec,
          variazione_percentuale: s.delta,
          numero: s.n,
          media_per_fattura: s.n ? Math.round(s.fatturato / s.n) : 0,
          da_incassare: s.daIncassare,
          fatture_aperte: s.aperte,
          rivalsa_inps: s.contributo,
          soglia_forfettario: {
            limite: SOGLIA_FORFETTARIO,
            usata_percentuale: Math.round(s.soglia),
            residuo: Math.max(0, SOGLIA_FORFETTARIO - s.fatturato),
            nota: 'Calcolata sulla data fattura; la norma considera gli incassi (principio di cassa).',
          },
          mensile: s.mesi.map((m) => ({ mese: m.label, incassato: m.pagato, da_incassare: m.aperto, fatture: m.n })),
          clienti: s.clienti.map((c) => ({
            cliente: c.nome, totale: c.totale, fatture: c.n,
            quota_percentuale: s.fatturato ? Math.round((c.totale / s.fatturato) * 100) : 0,
          })),
        },
        preventivi: {
          per_stato: per,
          tasso_accettazione_percentuale: decisi ? Math.round(((per.accettato?.n ?? 0) / decisi) * 100) : null,
          valore_in_attesa: per.inviato?.totale ?? 0,
        },
        abbonamenti_costo_mensile: abb.mensile,
        gestionale: `${baseApp()}/statistiche`,
      });
    }
  );

  server.registerTool(
    'lista_clienti',
    {
      title: 'Elenca clienti',
      description: 'Elenca i clienti in anagrafica con numero di preventivi e fatture.',
      inputSchema: z.object({ cerca: z.string().optional() }),
      annotations: sola,
    },
    async ({ cerca }) => {
      await ensureFattureXmlSchema();
      const q = cerca ? `%${cerca}%` : null;
      const rows = await sql`
        SELECT c.id, c.nome, c.azienda, c.email, c.telefono, c.piva, c.portale_attivo,
          (SELECT count(*)::int FROM preventivi p WHERE p.cliente_id = c.id) AS preventivi,
          (SELECT count(*)::int FROM fatture f WHERE f.cliente_id = c.id) AS fatture,
          (SELECT coalesce(sum(f.importo), 0)::float8 FROM fatture f WHERE f.cliente_id = c.id) AS fatturato
        FROM clienti c
        WHERE ${q}::text IS NULL OR c.nome ILIKE ${q} OR c.azienda ILIKE ${q} OR c.email ILIKE ${q}
        ORDER BY c.nome
      `;
      return testo(rows);
    }
  );
}
