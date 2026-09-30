import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import sql from '@/lib/db';
import { parseFattura, extractXml } from '@/lib/fattura/parse';
import {
  archivioSelect,
  collegaPreventivo,
  fattureDelPreventivo,
  preparaArchivio,
  preventiviCollegabili,
  salvaFattura,
} from '@/lib/fattura/server';
import { suggerisciPreventivi } from '@/lib/fattura/collegamenti';
import { calcolaAnalisi, SOGLIA_FORFETTARIO, type RigaAnalisi } from '@/lib/fattura/analisi';
import {
  applicaModello,
  controllaPreventivo,
  CAMPI_RICHIESTI_DEFAULT,
  daJson,
  inserisciPreventivo,
  leggiModello,
  modificaPreventivo,
  salvaModello,
  type PreventivoJson,
} from '@/lib/preventivi';
import { baseApp, baseSito, linkDownloadFattura } from './oauth';
import { FONTE_IDS, fonteLabel } from '@/lib/fonti';
import { aperturePerPreventivo, visiteDelPreventivo } from '@/lib/visite';
import { isScaduto, scadenzaEffettiva, VALIDITA_MAX_GIORNI } from '@/lib/scadenza';
import { ensureTardivaSchema, gestisciRichiestaTardiva, inAttesa } from '@/lib/tardiva';
import { calcolaListino, daClassificare } from '@/lib/listino';
import {
  classificaVoci,
  creaAzione,
  leggiAzioni,
  modificaAzione,
  raccogliOsservazioni,
} from '@/lib/listino-db';

export const ISTRUZIONI = `Gestionale di Mauro Altamura (Mauro Dev, sviluppatore web in regime forfettario).

NUOVO PREVENTIVO: intervista, non inventare.
1. Chiama leggi_modello_preventivo e segui le sue linee_guida. Individua il cliente (lista_clienti) e la sua fonte.
2. Raccogli le informazioni facendo domande all'utente, poche alla volta (2-4 per messaggio, raggruppate per argomento). Non inventare mai prezzi, date, dati del cliente o attività: se manca qualcosa, chiedilo. Se le risposte sono vaghe, approfondisci (obiettivo, pagine/funzionalità, cosa fornisce il cliente, vincoli, scadenze).
   Per i prezzi consulta listino filtrando per la fonte del cliente: proponi cifre coerenti con la media dei lavori svolti, dicendo su quanti lavori si basa; il prezzo finale lo decide l'utente.
3. Chiama controlla_preventivo con quello che hai: ti dice cosa manca o è debole e quali domande fare. Ripeti finché risulta completo.
4. Mostra all'utente un riepilogo (voci, totale, tranches, tempi, scadenza) e chiedi conferma. Solo dopo chiama crea_preventivo.
5. Mostra il link pubblico e il link PDF restituiti.

FATTURE: l'utente carica in chat l'XML FatturaPA dell'Agenzia delle Entrate; passa il testo XML integrale a importa_fattura. Se la risposta contiene preventivi_suggeriti, proponi il collegamento e chiedi conferma prima di chiamare collega_fattura_preventivo. Un preventivo può avere più fatture, anche di società diverse. I dati fiscali (ragione sociale, P.IVA, indirizzo) vengono dalle fatture, che sono la fonte di verità: il preventivo collegato si aggiorna da solo.
FONTE DEL CLIENTE (diretto / Astrolancer / Cream): è una divisione INTERNA. Non scriverla mai nei testi del preventivo né in nulla che vede il cliente.
LISTINO: le voci dei lavori (preventivi e fatture) sono raggruppate in "azioni". Se voci_lavori mostra voci da classificare, raggruppale per tipo di lavoro con classifica_voci (nomi brevi e riutilizzabili, es. "Landing page", "Intervento urgente", "Manutenzione ordinaria") e mostra all'utente la proposta prima di applicarla.
SCADENZA: ogni preventivo vale al massimo ${VALIDITA_MAX_GIORNI} giorni (predefinito ${VALIDITA_MAX_GIORNI}). Se è scaduto il cliente può chiedere un'accettazione tardiva dalla pagina: la trovi come richiesta_accettazione_tardiva e la gestisci con gestisci_accettazione_tardiva, sempre dopo la conferma dell'utente.
CLIENTE vs SOCIETÀ: il cliente è la persona/il rapporto; le società (lista_societa) sono i soggetti fiscali che ricevono le fatture. Un cliente può avere più società.

Importi in euro, date YYYY-MM-DD. Rispondi in italiano. Il PDF delle fatture si scarica dal link restituito (valido 24 ore).`;

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
    scadenza: scadenzaEffettiva(p),
    scaduto: p.stato === 'inviato' && isScaduto(p),
    ...(inAttesa(p.richiesta_tardiva) && {
      richiesta_accettazione_tardiva: {
        nome: `${p.richiesta_tardiva.nome} ${p.richiesta_tardiva.cognome}`,
        email: p.richiesta_tardiva.email,
        messaggio: p.richiesta_tardiva.messaggio,
        inviata_il: p.richiesta_tardiva.inviata_at,
      },
    }),
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
  scadenza: z.string().optional().describe('YYYY-MM-DD, al massimo 15 giorni da oggi (se manca: oggi + 15)'),
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
      description:
        'Elenca i preventivi, dal più recente, con quante volte il cliente ha aperto il link e quando. ' +
        'Filtri opzionali per stato e testo (cliente o oggetto).',
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
      const aperture = await aperturePerPreventivo();
      return testo(
        rows.map((p) => ({
          ...riepilogoPreventivo(p),
          aperture_link: aperture[p.id]?.aperture ?? 0,
          ultima_apertura: aperture[p.id]?.ultima ?? null,
        }))
      );
    }
  );

  server.registerTool(
    'leggi_preventivo',
    {
      title: 'Leggi preventivo',
      description:
        'Restituisce un preventivo completo (tutte le sezioni in JSON), le fatture collegate e le aperture del link ' +
        '(quando, per quanto tempo, da che dispositivo/città, sezioni lette, PDF scaricato).',
      inputSchema: z.object({ id: z.number().int() }),
      annotations: sola,
    },
    async ({ id }) => {
      const [p] = await sql`SELECT * FROM preventivi WHERE id = ${id}`;
      if (!p) return errore(`Preventivo ${id} non trovato`);
      await preparaArchivio();
      const { fatture, riepilogo } = await fattureDelPreventivo(id);
      return testo({
        ...riepilogoPreventivo(p),
        dati: p.meta,
        tranches_stato: p.tranches_stato,
        fatture: fatture.map((f) => ({ id: f.id, numero: f.numero, data: f.data, societa: f.intestatario, piva: f.piva, importo: f.importo, stato: f.stato })),
        fatturazione: riepilogo,
        aperture_link: await visiteDelPreventivo(id, 10),
      });
    }
  );

  server.registerTool(
    'crea_preventivo',
    {
      title: 'Crea preventivo',
      description:
        'Crea un nuovo preventivo e restituisce il link pubblico da mandare al cliente e il link al PDF. ' +
        'Usalo solo dopo aver intervistato l’utente, aver ottenuto completo=true da controlla_preventivo e la sua conferma. ' +
        'Se mancano informazioni rifiuta la creazione e restituisce le domande da fare.',
      inputSchema: z.object({
        cliente: clienteSchema,
        preventivo: testataSchema,
        sezioni: sezioniSchema.extend({ voci: z.object({ modalita: z.string().optional(), items: z.array(voceSchema).min(1) }) }),
        usa_modello: z.boolean().default(true).describe('Completa i campi mancanti con i predefiniti del modello'),
        conferma_incompleto: z
          .boolean()
          .default(false)
          .describe('true SOLO se l’utente ha detto esplicitamente di creare il preventivo anche se incompleto'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ usa_modello, conferma_incompleto, ...dati }) => {
      try {
        const modello = await leggiModello();
        const completo = usa_modello ? applicaModello(dati as PreventivoJson, modello) : (dati as PreventivoJson);
        const esito = controllaPreventivo(completo, modello);
        if (!esito.completo && !conferma_incompleto) {
          return errore(
            'Preventivo NON creato: servono altre informazioni. Fai all’utente queste domande (poche per volta), ' +
              'poi richiama controlla_preventivo.\n' +
              JSON.stringify({ mancanti: esito.mancanti, da_migliorare: esito.da_migliorare }, null, 2)
          );
        }
        const p = await inserisciPreventivo(daJson(completo));
        return testo({ creato: true, ...riepilogoPreventivo(p), dati: completo });
      } catch (e) {
        return errore((e as Error).message);
      }
    }
  );

  server.registerTool(
    'controlla_preventivo',
    {
      title: 'Controlla bozza di preventivo',
      description:
        'Verifica una bozza di preventivo (anche parziale) prima di crearla: applica il modello e restituisce i campi ' +
        'mancanti e quelli da migliorare, ciascuno con la domanda da fare all’utente. Non salva nulla. ' +
        'Usalo durante l’intervista finché completo=true.',
      inputSchema: z.object({
        cliente: clienteSchema.partial().optional(),
        preventivo: testataSchema.partial().optional(),
        sezioni: sezioniSchema.optional(),
      }),
      annotations: sola,
    },
    async (bozza) => {
      const modello = await leggiModello();
      const dati = applicaModello(
        { cliente: { ...bozza.cliente }, preventivo: { ...bozza.preventivo }, sezioni: { ...bozza.sezioni } } as PreventivoJson,
        modello
      );
      const esito = controllaPreventivo(dati, modello);
      return testo({
        completo: esito.completo,
        totale: esito.totale,
        mancanti: esito.mancanti,
        da_migliorare: esito.da_migliorare,
        campi_dal_modello: Object.keys({ ...modello.preventivo, ...modello.sezioni }),
        bozza_completata: esito.dati,
      });
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

  server.registerTool(
    'gestisci_accettazione_tardiva',
    {
      title: 'Gestisci accettazione tardiva',
      description:
        'Decide su un preventivo scaduto. approva: lo segna accettato con i dati della richiesta del cliente e invia la conferma; ' +
        `riapri: nuova scadenza a ${VALIDITA_MAX_GIORNI} giorni da oggi (se c'è una richiesta il cliente riceve il link per accettare); ` +
        'rifiuta: chiude la richiesta senza email. Chiedi sempre conferma all’utente prima di usarlo.',
      inputSchema: z.object({ id: z.number().int(), azione: z.enum(['approva', 'riapri', 'rifiuta']) }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async ({ id, azione }) => {
      try {
        await ensureTardivaSchema();
        const p = await gestisciRichiestaTardiva(id, azione, (fn) => fn());
        return testo({ fatto: azione, ...riepilogoPreventivo(p) });
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
      return testo({
        ...(Object.keys(m).length ? m : { vuoto: true, suggerimento: 'Nessun modello: usa aggiorna_modello_preventivo per definirlo.' }),
        campi_richiesti: m.campi_richiesti?.length ? m.campi_richiesti : CAMPI_RICHIESTI_DEFAULT,
      });
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
        validita_giorni: z.number().int().min(1).max(15).optional(),
        campi_richiesti: z
          .array(z.string())
          .optional()
          .describe(`Campi obbligatori prima della creazione. Default: ${CAMPI_RICHIESTI_DEFAULT.join(', ')}`),
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
        ...(patch.campi_richiesti !== undefined && { campi_richiesti: patch.campi_richiesti }),
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
        preventivo_id: z.number().int().optional().describe('Collega subito la fattura a questo preventivo (solo se confermato dall’utente)'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ xml, salva, con_logo, preventivo_id }) => {
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
        societa: {
          denominazione: f.committente.nome,
          piva: f.committente.piva,
          codice_fiscale: f.committente.cf,
          indirizzo: [f.committente.indirizzo, f.committente.localita].filter(Boolean).join(', '),
          codice_destinatario: f.codiceDestinatario,
          pec: f.pecDestinatario,
        },
        righe: f.linee.map((l) => ({ descrizione: l.descrizione, importo: l.prezzoTotale })),
        contributo_inps: f.casse.reduce((s, c) => s + c.importo, 0),
        totale: f.totaleDocumento,
        scadenza: f.pagamenti[0]?.scadenza ?? null,
      };
      await preparaArchivio();
      const suggerimenti = (riga: { cliente_id: number | null; preventivo_id?: number | null; id?: number }) =>
        preventiviCollegabili().then((prev) =>
          suggerisciPreventivi(
            { ...riga, data: f.data, importo: f.totaleDocumento, cliente_nome: f.committente.nome, cliente_piva: f.committente.piva },
            prev
          )
        );
      if (!salva) return testo({ salvata: false, ...riepilogo, preventivi_suggeriti: await suggerimenti({ cliente_id: null }) });

      let row;
      try {
        row = await salvaFattura(f, xml, con_logo, preventivo_id);
      } catch (e) {
        return errore((e as Error).message);
      }
      return testo({
        salvata: true,
        id: row.id,
        cliente_collegato: row.cliente_id != null,
        stato: row.stato,
        ...riepilogo,
        preventivo_collegato: row.preventivo_id ? { id: row.preventivo_id, oggetto: row.preventivo_oggetto } : null,
        ...(!row.preventivo_id && { preventivi_suggeriti: await suggerimenti({ id: row.id, cliente_id: row.cliente_id }) }),
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
      await preparaArchivio();
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
          preventivo: r.preventivo_id ? { id: r.preventivo_id, oggetto: r.preventivo_oggetto } : null,
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
      await preparaArchivio();
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
      await preparaArchivio();
      const rows = await sql`UPDATE fatture SET stato = ${stato}, updated_at = NOW() WHERE id = ${id} RETURNING id`;
      return rows.length ? testo({ id, stato }) : errore(`Fattura ${id} non trovata`);
    }
  );

  server.registerTool(
    'collega_fattura_preventivo',
    {
      title: 'Collega fattura a preventivo',
      description:
        'Collega una fattura in archivio a un preventivo (preventivo_id null per scollegarla). Un preventivo può avere ' +
        'più fatture, anche di società diverse. Il preventivo prende da lì ragione sociale e P.IVA; se era "inviato" ' +
        'diventa "accettato". Chiedi conferma all’utente prima di collegare.',
      inputSchema: z.object({ fattura_id: z.number().int(), preventivo_id: z.number().int().nullable() }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ fattura_id, preventivo_id }) => {
      await preparaArchivio();
      try {
        await collegaPreventivo(fattura_id, preventivo_id);
      } catch (e) {
        return errore((e as Error).message);
      }
      if (preventivo_id == null) return testo({ scollegata: true, fattura_id });
      const [p] = await sql`SELECT * FROM preventivi WHERE id = ${preventivo_id}`;
      const { riepilogo } = await fattureDelPreventivo(preventivo_id);
      return testo({ collegata: true, fattura_id, preventivo: riepilogoPreventivo(p), fatturazione: riepilogo });
    }
  );

  server.registerTool(
    'preventivi_per_fattura',
    {
      title: 'Suggerisci preventivo per una fattura',
      description: 'Suggerisce a quale preventivo collegare una fattura in archivio (per cliente, P.IVA, nome e importo).',
      inputSchema: z.object({ fattura_id: z.number().int() }),
      annotations: sola,
    },
    async ({ fattura_id }) => {
      await preparaArchivio();
      const [r] = await sql`${archivioSelect()} WHERE id = ${fattura_id}`;
      if (!r) return errore(`Fattura ${fattura_id} non trovata`);
      const s = suggerisciPreventivi(r as Parameters<typeof suggerisciPreventivi>[0], await preventiviCollegabili(), 5);
      return testo({ fattura: { id: r.id, numero: r.numero, societa: r.cliente_nome, importo: r.importo }, collegata_a: r.preventivo_id, suggeriti: s });
    }
  );

  server.registerTool(
    'lista_societa',
    {
      title: 'Elenca società / dati fiscali',
      description:
        'Elenca le società intestatarie delle fatture con i dati fiscali (dall’ultima fattura), il cliente a cui ' +
        'appartengono e quanto è stato fatturato.',
      inputSchema: z.object({ cerca: z.string().optional().describe('Ragione sociale o P.IVA') }),
      annotations: sola,
    },
    async ({ cerca }) => {
      await preparaArchivio();
      const q = cerca ? `%${cerca}%` : null;
      const rows = await sql`
        SELECT i.id, i.denominazione, i.piva, i.codice_fiscale, i.indirizzo, i.localita, i.codice_destinatario, i.pec,
               to_char(i.dati_al, 'YYYY-MM-DD') AS dati_al, i.cliente_id, c.nome AS cliente,
               count(f.id)::int AS fatture, COALESCE(sum(f.importo), 0)::float8 AS fatturato
        FROM intestatari i
        LEFT JOIN clienti c ON c.id = i.cliente_id
        LEFT JOIN fatture f ON f.intestatario_id = i.id
        WHERE ${q}::text IS NULL OR i.denominazione ILIKE ${q} OR i.piva ILIKE ${q}
        GROUP BY i.id, c.nome ORDER BY fatturato DESC
      `;
      return testo(rows);
    }
  );

  server.registerTool(
    'collega_societa_cliente',
    {
      title: 'Collega società a cliente',
      description:
        'Associa una società (soggetto fiscale) a un cliente in anagrafica, o la scollega con cliente_id null. ' +
        'Le fatture future di quella società verranno attribuite a quel cliente.',
      inputSchema: z.object({
        societa_id: z.number().int(),
        cliente_id: z.number().int().nullable(),
        aggiorna_fatture: z.boolean().default(true).describe('Attribuisci al cliente anche le fatture già emesse a questa società'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ societa_id, cliente_id, aggiorna_fatture }) => {
      await preparaArchivio();
      if (cliente_id != null) {
        const [c] = await sql`SELECT id FROM clienti WHERE id = ${cliente_id}`;
        if (!c) return errore(`Cliente ${cliente_id} non trovato`);
      }
      const rows = await sql`UPDATE intestatari SET cliente_id = ${cliente_id}, updated_at = NOW() WHERE id = ${societa_id} RETURNING denominazione`;
      if (!rows.length) return errore(`Società ${societa_id} non trovata`);
      let fatture = 0;
      if (aggiorna_fatture && cliente_id != null) {
        fatture = (await sql`UPDATE fatture SET cliente_id = ${cliente_id} WHERE intestatario_id = ${societa_id} RETURNING id`).length;
      }
      return testo({ societa: rows[0].denominazione, cliente_id, fatture_aggiornate: fatture });
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
      await preparaArchivio();
      const a = anno ?? new Date().getFullYear();

      const archivio = (await sql`${archivioSelect()} WHERE xml IS NOT NULL AND anno IN (${a}, ${a - 1})`) as RigaAnalisi[];
      const s = calcolaAnalisi(archivio, a);

      const prev = await sql`
        SELECT stato, count(*)::int AS n, coalesce(sum(totale), 0)::float8 AS totale
        FROM preventivi WHERE extract(year FROM created_at) = ${a} GROUP BY stato
      `;
      const per = Object.fromEntries(prev.map((r) => [r.stato, { n: r.n, totale: r.totale }]));
      const decisi = (per.accettato?.n ?? 0) + (per.rifiutato?.n ?? 0);

      const perFonte = await sql`
        SELECT c.fonte, count(*)::int AS lavori, COALESCE(sum(p.totale), 0)::float8 AS valore
        FROM preventivi p LEFT JOIN clienti c ON c.id = p.cliente_id
        WHERE p.stato IN ('accettato', 'archiviato') AND extract(year FROM p.created_at) = ${a}
        GROUP BY c.fonte ORDER BY valore DESC
      `;

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
          lavori_acquisiti_per_fonte: perFonte.map((r) => ({ fonte: fonteLabel(r.fonte), lavori: r.lavori, valore: r.valore })),
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
      description:
        'Elenca i clienti in anagrafica con fonte (interna: diretto/agenzia), numero di preventivi e fatture.',
      inputSchema: z.object({ cerca: z.string().optional() }),
      annotations: sola,
    },
    async ({ cerca }) => {
      await preparaArchivio();
      const q = cerca ? `%${cerca}%` : null;
      const rows = await sql`
        SELECT c.id, c.nome, c.azienda, c.email, c.telefono, c.piva, c.portale_attivo, c.fonte,
          (SELECT count(*)::int FROM preventivi p WHERE p.cliente_id = c.id) AS preventivi,
          (SELECT count(*)::int FROM fatture f WHERE f.cliente_id = c.id) AS fatture,
          (SELECT coalesce(sum(f.importo), 0)::float8 FROM fatture f WHERE f.cliente_id = c.id) AS fatturato
        FROM clienti c
        WHERE ${q}::text IS NULL OR c.nome ILIKE ${q} OR c.azienda ILIKE ${q} OR c.email ILIKE ${q}
        ORDER BY c.nome
      `;
      return testo(rows.map((r) => ({ ...r, fonte_label: fonteLabel(r.fonte) })));
    }
  );

  server.registerTool(
    'imposta_fonte_cliente',
    {
      title: 'Imposta fonte cliente',
      description:
        `Imposta da dove arriva il cliente (${FONTE_IDS.join(', ')}) oppure null per "da assegnare". ` +
        'È una divisione interna: non compare mai nei preventivi né al cliente.',
      inputSchema: z.object({
        cliente_id: z.number().int(),
        fonte: z.enum(FONTE_IDS as [string, ...string[]]).nullable(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ cliente_id, fonte }) => {
      await preparaArchivio();
      const rows = await sql`UPDATE clienti SET fonte = ${fonte}, updated_at = NOW() WHERE id = ${cliente_id} RETURNING nome`;
      return rows.length ? testo({ cliente: rows[0].nome, fonte: fonteLabel(fonte) }) : errore(`Cliente ${cliente_id} non trovato`);
    }
  );

  // ── Listino ──

  server.registerTool(
    'listino',
    {
      title: 'Listino per azione e fonte',
      description:
        'Prezzo medio, mediana, min/max e ultimo prezzo di ogni azione (tipo di lavoro), in totale e per fonte del ' +
        'cliente. Da usare per orientarsi nei nuovi preventivi. Prezzi come pagati dal cliente (rivalsa INPS inclusa).',
      inputSchema: z.object({
        fonte: z.enum(FONTE_IDS as [string, ...string[]]).optional().describe('Mostra solo questa fonte (oltre al totale)'),
        cerca: z.string().optional().describe('Filtra per nome azione o categoria'),
        solo_svolti: z.boolean().default(true).describe('true = solo preventivi accettati/archiviati e fatture'),
      }),
      annotations: sola,
    },
    async ({ fonte, cerca, solo_svolti }) => {
      const [oss, azioni] = [await raccogliOsservazioni(), await leggiAzioni()];
      const q = cerca?.toLowerCase();
      const righe = calcolaListino(oss, azioni, { soloSvolti: solo_svolti, fonti: [...FONTE_IDS] })
        .filter((r) => !q || r.azione.nome.toLowerCase().includes(q) || (r.azione.categoria ?? '').toLowerCase().includes(q))
        .map((r) => ({
          azione_id: r.azione.id,
          azione: r.azione.nome,
          categoria: r.azione.categoria,
          unita: r.azione.unita,
          ...(fonte
            ? { [fonteLabel(fonte)]: r.per_fonte[fonte], tutte: r.per_fonte.tutte }
            : Object.fromEntries(Object.entries(r.per_fonte).map(([k, v]) => [k === 'tutte' || k === 'nessuna' ? k : fonteLabel(k), v]))),
        }));
      const libere = daClassificare(oss).length;
      return testo({ azioni: righe, voci_da_classificare: libere, gestionale: `${baseApp()}/listino` });
    }
  );

  server.registerTool(
    'voci_lavori',
    {
      title: 'Voci dei lavori',
      description:
        'Elenca le singole voci di lavoro (da preventivi e fatture) con prezzo, cliente, fonte e azione. ' +
        'Con da_classificare=true restituisce le descrizioni ancora senza azione, raggruppate.',
      inputSchema: z.object({
        da_classificare: z.boolean().default(false),
        azione_id: z.number().int().optional(),
        fonte: z.enum(FONTE_IDS as [string, ...string[]]).optional(),
        cerca: z.string().optional().describe('Testo nella descrizione o nel cliente'),
        limite: z.number().int().min(1).max(500).default(100),
      }),
      annotations: sola,
    },
    async ({ da_classificare, azione_id, fonte, cerca, limite }) => {
      const oss = await raccogliOsservazioni();
      if (da_classificare) {
        const libere = daClassificare(oss);
        return testo({ totale: libere.length, voci: libere.slice(0, limite), azioni_esistenti: await leggiAzioni() });
      }
      const q = cerca?.toLowerCase();
      const azioni = new Map((await leggiAzioni()).map((a) => [a.id, a.nome]));
      const righe = oss
        .filter((o) => (azione_id == null || o.azione_id === azione_id) && (!fonte || o.fonte === fonte))
        .filter((o) => !q || o.descrizione.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q))
        .slice(0, limite)
        .map((o) => ({
          data: o.data,
          descrizione: o.descrizione,
          prezzo: o.prezzo,
          quantita: o.quantita,
          cliente: o.cliente,
          fonte: fonteLabel(o.fonte),
          origine: o.origine === 'preventivo' ? `preventivo ${o.rif_id}: ${o.rif}` : o.rif,
          svolto: o.svolto,
          azione: o.azione_id ? azioni.get(o.azione_id) : null,
        }));
      return testo(righe);
    }
  );

  server.registerTool(
    'classifica_voci',
    {
      title: 'Classifica voci nel listino',
      description:
        'Assegna una o più voci (descrizioni esatte, come restituite da voci_lavori) a un’azione. Indica azione_id ' +
        'di un’azione esistente oppure azione_nome: se non esiste viene creata. azione_id null = rimetti da classificare.',
      inputSchema: z.object({
        descrizioni: z.array(z.string()).min(1),
        azione_id: z.number().int().nullable().optional(),
        azione_nome: z.string().optional(),
        categoria: z.string().optional().describe('Solo per azioni nuove, es. "Siti web", "Grafica", "Assistenza"'),
        unita: z.string().optional().describe('Solo per azioni nuove, es. "a progetto", "a pagina", "mensile", "a intervento"'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ descrizioni, azione_id, azione_nome, categoria, unita }) => {
      try {
        let id = azione_id ?? null;
        if (azione_id === undefined) {
          if (!azione_nome) return errore('Indica azione_id oppure azione_nome');
          id = (await creaAzione({ nome: azione_nome, categoria, unita })).id;
        }
        const n = await classificaVoci(descrizioni, id);
        return testo({ classificate: n, azione_id: id });
      } catch (e) {
        return errore((e as Error).message);
      }
    }
  );

  server.registerTool(
    'modifica_azione',
    {
      title: 'Modifica azione del listino',
      description: 'Rinomina un’azione, cambia categoria/unità/note, oppure la unisce in un’altra (unisci_in).',
      inputSchema: z.object({
        id: z.number().int(),
        nome: z.string().optional(),
        categoria: z.string().nullable().optional(),
        unita: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        unisci_in: z.number().int().optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, ...a }) => {
      try {
        const r = await modificaAzione(id, a);
        return testo(r ?? { unita_in: a.unisci_in });
      } catch (e) {
        return errore((e as Error).message);
      }
    }
  );

  // ── Prompt ──

  server.registerPrompt(
    'nuovo_preventivo',
    {
      title: 'Nuovo preventivo',
      description: 'Claude ti intervista per raccogliere tutto ciò che serve e poi crea il preventivo.',
      argsSchema: z.object({
        cliente: z.string().optional().describe('Cliente o azienda, se già noto'),
        progetto: z.string().optional().describe('Due righe sul progetto, se già note'),
      }),
    },
    ({ cliente, progetto }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text:
              'Voglio creare un nuovo preventivo. Intervistami per compilarlo correttamente: ' +
              'leggi prima il modello dei preventivi, poi fammi le domande poche alla volta, approfondisci dove sono vago, ' +
              'usa controlla_preventivo per capire cosa manca e non inventare prezzi, date o dati del cliente. ' +
              'Prima di crearlo mostrami un riepilogo e chiedimi conferma.' +
              (cliente ? `\nCliente: ${cliente}.` : '') +
              (progetto ? `\nProgetto: ${progetto}.` : ''),
          },
        },
      ],
    })
  );
}
