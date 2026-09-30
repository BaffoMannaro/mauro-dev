import { nanoid } from 'nanoid';
import sql from './db';
import { ensureClientiSchema } from './schema';
import { limitaScadenza, VALIDITA_MAX_GIORNI } from './scadenza';

// ─── Formato JSON del preventivo (lo stesso del modulo "Nuovo preventivo") ───

export interface Voce {
  descrizione: string;
  quantita: number;
  prezzo: number;
}

export interface Sezioni {
  intro?: string;
  descrizione?: string;
  voci?: { modalita?: string; items: Voce[] };
  tranches?: { descrizione: string; percentuale: number }[];
  tempi?: string;
  garanzia?: string;
  esclusioni?: string[];
  manutenzione?: { descrizione: string; prezzo: number };
  fasi_successive?: string;
  note?: string;
}

export interface PreventivoJson {
  cliente: { nome: string; email: string; azienda?: string; piva?: string; telefono?: string };
  preventivo: {
    oggetto: string;
    data?: string;
    scadenza?: string;
    iva?: boolean;
    modalita_pagamento?: string;
    schema_pagamento?: string;
  };
  sezioni: Sezioni;
}

/** Input "normalizzato" accettato da POST /api/preventivi. */
export interface NuovoPreventivoInput {
  cliente: { nome: string; azienda?: string | null; email: string };
  oggetto: string;
  voci: Voce[];
  note?: string | null;
  scadenza?: string | null;
  iva?: boolean;
  meta?: unknown;
}

export async function inserisciPreventivo(body: NuovoPreventivoInput) {
  const voci = body.voci || [];
  const totale = voci.reduce((acc, v) => acc + v.quantita * v.prezzo, 0);

  const [preventivo] = await sql`
    INSERT INTO preventivi (
      token, cliente_nome, cliente_azienda, cliente_email,
      oggetto, voci, note, scadenza, totale, iva, meta
    ) VALUES (
      ${nanoid(8)},
      ${body.cliente.nome},
      ${body.cliente.azienda || null},
      ${body.cliente.email},
      ${body.oggetto},
      ${JSON.stringify(voci)},
      ${body.note || null},
      ${limitaScadenza(body.scadenza)},
      ${totale},
      ${body.iva === true},
      ${body.meta ? JSON.stringify(body.meta) : null}
    )
    RETURNING *
  `;
  return preventivo;
}

/** Stessa validazione e mappatura del modulo "Nuovo preventivo". */
export function daJson(dati: PreventivoJson): NuovoPreventivoInput {
  if (!dati.cliente?.nome) throw new Error('Campo cliente.nome obbligatorio');
  if (!dati.cliente?.email) throw new Error('Campo cliente.email obbligatorio');
  if (!dati.preventivo?.oggetto) throw new Error('Campo preventivo.oggetto obbligatorio');
  if (!dati.sezioni?.voci?.items?.length) throw new Error('Sezione sezioni.voci.items obbligatoria');

  return {
    cliente: { nome: dati.cliente.nome, azienda: dati.cliente.azienda || null, email: dati.cliente.email },
    oggetto: dati.preventivo.oggetto,
    voci: dati.sezioni.voci.items,
    note: dati.sezioni.note || null,
    scadenza: dati.preventivo.scadenza,
    iva: dati.preventivo.iva === true,
    meta: dati,
  };
}

// ─── Modello: predefiniti e linee guida per i nuovi preventivi ───

export const CHIAVE_MODELLO = 'modello_preventivo';

export interface ModelloPreventivo {
  /** Istruzioni di stile/contenuto che Claude segue quando scrive un preventivo. */
  linee_guida?: string;
  /** Giorni di validità usati per la scadenza quando non è indicata (massimo 15). */
  validita_giorni?: number;
  /** Valori predefiniti di "preventivo" (es. iva, modalita_pagamento, schema_pagamento). */
  preventivo?: Partial<PreventivoJson['preventivo']>;
  /** Sezioni predefinite (es. tranches, garanzia, esclusioni, tempi, manutenzione). */
  sezioni?: Partial<Sezioni>;
  /** Campi da compilare prima di creare un preventivo (percorsi, es. "sezioni.tempi"). */
  campi_richiesti?: string[];
}

export async function leggiModello(): Promise<ModelloPreventivo> {
  await ensureClientiSchema();
  const [row] = await sql`SELECT valore FROM impostazioni WHERE chiave = ${CHIAVE_MODELLO}`;
  return (row?.valore as ModelloPreventivo) ?? {};
}

export async function salvaModello(modello: ModelloPreventivo) {
  await ensureClientiSchema();
  await sql`
    INSERT INTO impostazioni (chiave, valore, updated_at)
    VALUES (${CHIAVE_MODELLO}, ${JSON.stringify(modello)}::jsonb, NOW())
    ON CONFLICT (chiave) DO UPDATE SET valore = EXCLUDED.valore, updated_at = NOW()
  `;
}

const vuoto = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0);

/** Completa i campi mancanti con i predefiniti del modello (i dati espliciti vincono sempre). */
export function applicaModello(dati: PreventivoJson, modello: ModelloPreventivo): PreventivoJson {
  const preventivo = { ...dati.preventivo } as Record<string, unknown>;
  for (const [k, v] of Object.entries(modello.preventivo ?? {})) {
    if (vuoto(preventivo[k])) preventivo[k] = v;
  }
  if (vuoto(preventivo.scadenza) && modello.validita_giorni) {
    const giorni = Math.min(modello.validita_giorni, VALIDITA_MAX_GIORNI);
    preventivo.scadenza = new Date(Date.now() + giorni * 86400000).toISOString().slice(0, 10);
  }

  const sezioni = { ...dati.sezioni } as Record<string, unknown>;
  for (const [k, v] of Object.entries(modello.sezioni ?? {})) {
    if (k !== 'voci' && vuoto(sezioni[k])) sezioni[k] = v;
  }

  return { ...dati, preventivo: preventivo as PreventivoJson['preventivo'], sezioni: sezioni as Sezioni };
}

// ─── Modifica di un preventivo esistente ───

export interface ModificaPreventivo {
  cliente?: Partial<PreventivoJson['cliente']>;
  preventivo?: Partial<PreventivoJson['preventivo']>;
  /** Le sezioni indicate sostituiscono quelle esistenti; le altre restano invariate. */
  sezioni?: Partial<Sezioni>;
  stato?: 'inviato' | 'accettato' | 'rifiutato' | 'archiviato';
}

export async function modificaPreventivo(id: number, m: ModificaPreventivo) {
  const [attuale] = await sql`SELECT * FROM preventivi WHERE id = ${id}`;
  if (!attuale) throw new Error(`Preventivo ${id} non trovato`);

  const meta = (attuale.meta ?? {}) as PreventivoJson;
  const nuovo: PreventivoJson = {
    cliente: { ...meta.cliente, nome: attuale.cliente_nome, email: attuale.cliente_email, ...m.cliente },
    preventivo: { ...meta.preventivo, oggetto: attuale.oggetto, ...m.preventivo },
    sezioni: { ...meta.sezioni, ...m.sezioni },
  };
  const voci: Voce[] = nuovo.sezioni.voci?.items ?? attuale.voci;
  if (!nuovo.sezioni.voci) nuovo.sezioni.voci = { items: voci };
  const totale = voci.reduce((acc, v) => acc + v.quantita * v.prezzo, 0);

  const [row] = await sql`
    UPDATE preventivi SET
      cliente_nome = ${nuovo.cliente.nome},
      cliente_azienda = ${nuovo.cliente.azienda || null},
      cliente_email = ${nuovo.cliente.email},
      oggetto = ${nuovo.preventivo.oggetto},
      voci = ${JSON.stringify(voci)},
      note = ${nuovo.sezioni.note || null},
      scadenza = ${m.preventivo?.scadenza ? limitaScadenza(m.preventivo.scadenza) : attuale.scadenza},
      totale = ${totale},
      iva = ${nuovo.preventivo.iva ?? attuale.iva},
      stato = ${m.stato ?? attuale.stato},
      meta = ${JSON.stringify(nuovo)},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return row;
}

// ─── Controllo di completezza (guida l'intervista di Claude) ───

/** Campi richiesti se il modello non ne definisce altri. */
export const CAMPI_RICHIESTI_DEFAULT = [
  'cliente.nome',
  'cliente.email',
  'preventivo.oggetto',
  'sezioni.intro',
  'sezioni.descrizione',
  'sezioni.voci',
  'sezioni.tranches',
  'sezioni.tempi',
  'sezioni.esclusioni',
];

const DOMANDE: Record<string, string> = {
  'cliente.nome': 'Chi è il referente del cliente (nome e cognome)?',
  'cliente.email': 'A quale email mando il preventivo?',
  'cliente.azienda': 'Per quale azienda è il preventivo (ragione sociale)?',
  'cliente.piva': 'Qual è la P.IVA dell’azienda?',
  'cliente.telefono': 'Hai un numero di telefono del referente?',
  'preventivo.oggetto': 'Come intitoliamo il progetto (oggetto del preventivo)?',
  'preventivo.scadenza': 'Fino a quando deve essere valida l’offerta? (massimo 15 giorni, predefinito 15)',
  'preventivo.modalita_pagamento': 'Come pagherà il cliente (bonifico, altro)?',
  'sezioni.intro': 'Com’è nato il contatto (call, email, passaparola) e cosa vuoi dire in apertura al cliente?',
  'sezioni.descrizione': 'Qual è l’obiettivo del progetto e quali attività comprende, passo per passo?',
  'sezioni.voci': 'Quali sono le voci di costo, con quantità e prezzo di ciascuna?',
  'sezioni.tranches': 'Come dividiamo il pagamento (es. 50% alla firma e 50% alla consegna)?',
  'sezioni.tempi': 'In quanto tempo consegni e da quando partono i tempi?',
  'sezioni.garanzia': 'Che garanzia o supporto post-lancio includi?',
  'sezioni.esclusioni': 'Cosa NON è incluso (testi, foto, hosting, dominio, campagne…)?',
  'sezioni.manutenzione': 'Vuoi proporre un piano di manutenzione mensile? Con quale canone?',
  'sezioni.fasi_successive': 'Ci sono fasi successive o sviluppi futuri da anticipare?',
};

export interface EsitoControllo {
  completo: boolean;
  mancanti: { campo: string; domanda: string }[];
  da_migliorare: { campo: string; problema: string; domanda: string }[];
  totale: number;
  dati: PreventivoJson;
}

function valore(dati: PreventivoJson, percorso: string): unknown {
  const v = percorso.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], dati);
  if (percorso === 'sezioni.voci') return (v as Sezioni['voci'])?.items;
  return v;
}

/**
 * Verifica che il preventivo (già completato con il modello) abbia tutto ciò che serve.
 * Restituisce i campi mancanti e quelli deboli, ciascuno con la domanda da fare all'utente.
 */
export function controllaPreventivo(dati: PreventivoJson, modello: ModelloPreventivo): EsitoControllo {
  const richiesti = modello.campi_richiesti?.length ? modello.campi_richiesti : CAMPI_RICHIESTI_DEFAULT;
  const domanda = (c: string) => DOMANDE[c] ?? `Mi dai il valore di "${c}"?`;

  const mancanti = richiesti.filter((c) => vuoto(valore(dati, c))).map((campo) => ({ campo, domanda: domanda(campo) }));
  const da_migliorare: EsitoControllo['da_migliorare'] = [];
  const debole = (campo: string, problema: string, d = domanda(campo)) => da_migliorare.push({ campo, problema, domanda: d });

  const email = dati.cliente?.email ?? '';
  if (email && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || /da_?compilare|example|test@/i.test(email))) {
    debole('cliente.email', `L’email "${email}" non sembra reale.`);
  }

  const voci = dati.sezioni?.voci?.items ?? [];
  voci.forEach((v, i) => {
    if (!v.prezzo || v.prezzo <= 0) debole(`sezioni.voci[${i}]`, `La voce "${v.descrizione}" non ha un prezzo.`, `Quanto costa "${v.descrizione}"?`);
    if ((v.descrizione ?? '').trim().length < 8) debole(`sezioni.voci[${i}]`, `La voce "${v.descrizione}" è troppo generica.`, 'Puoi descrivere meglio questa voce (cosa include)?');
  });
  const totale = voci.reduce((t, v) => t + (v.quantita || 0) * (v.prezzo || 0), 0);
  if (voci.length === 1 && totale >= 3000) {
    debole('sezioni.voci', 'Un’unica voce per un importo alto è poco leggibile per il cliente.', 'Possiamo dividere il lavoro in più voci (es. design, sviluppo, contenuti, messa online)?');
  }

  const tranches = dati.sezioni?.tranches ?? [];
  const somma = tranches.reduce((t, x) => t + (x.percentuale || 0), 0);
  if (tranches.length && Math.round(somma) !== 100) {
    debole('sezioni.tranches', `Le tranches sommano al ${somma}% invece che al 100%.`, 'Come correggiamo le percentuali delle tranches?');
  }

  const scad = dati.preventivo?.scadenza;
  if (scad && scad < new Date().toISOString().slice(0, 10)) {
    debole('preventivo.scadenza', `La scadenza ${scad} è già passata.`);
  } else if (scad && scad > limitaScadenza(null)) {
    debole('preventivo.scadenza', `La validità massima è ${VALIDITA_MAX_GIORNI} giorni: la scadenza verrà ridotta al ${limitaScadenza(null)}.`);
  }

  const descr = dati.sezioni?.descrizione ?? '';
  if (descr && descr.length < 120) {
    debole('sezioni.descrizione', 'La descrizione del progetto è molto breve.', 'Mi racconti meglio il progetto: obiettivo, pagine/funzionalità, cosa ti fornisce il cliente?');
  }

  return { completo: mancanti.length === 0 && da_migliorare.length === 0, mancanti, da_migliorare, totale, dati };
}
