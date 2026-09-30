import { nanoid } from 'nanoid';
import sql from './db';
import { ensureClientiSchema } from './schema';

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
      ${body.scadenza || null},
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
  /** Giorni di validità usati per la scadenza quando non è indicata. */
  validita_giorni?: number;
  /** Valori predefiniti di "preventivo" (es. iva, modalita_pagamento, schema_pagamento). */
  preventivo?: Partial<PreventivoJson['preventivo']>;
  /** Sezioni predefinite (es. tranches, garanzia, esclusioni, tempi, manutenzione). */
  sezioni?: Partial<Sezioni>;
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
    const d = new Date(Date.now() + modello.validita_giorni * 86400000);
    preventivo.scadenza = d.toISOString().slice(0, 10);
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
      scadenza = ${nuovo.preventivo.scadenza || attuale.scadenza || null},
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
