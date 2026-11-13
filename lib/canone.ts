import sql from './db';
import { ensureFattureXmlSchema } from './schema';
import { calcolaMesi, fmtMinuti, meseDi, nomeMese, type MeseCanone } from './canone-calcolo';

// Canone ore mensile di un cliente: canone, registro interventi, lavori (timeline) e richieste.
// La pagina cliente è /canone su area.maurodev.it; Mauro registra le ore dal gestionale o via MCP.

let ensured = false;

export async function ensureCanoneSchema() {
  await ensureFattureXmlSchema();
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS canoni (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      ore_mese DECIMAL(6,2) NOT NULL,
      prezzo_mese DECIMAL(10,2) NOT NULL,
      tariffa_extra DECIMAL(10,2) NOT NULL,
      inizio DATE NOT NULL,
      fine DATE,
      riporto_mesi INTEGER NOT NULL DEFAULT 1,
      siti TEXT[] NOT NULL DEFAULT '{}',
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS canoni_cliente ON canoni (cliente_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS interventi (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      data DATE NOT NULL,
      sito TEXT,
      descrizione TEXT NOT NULL,
      minuti INTEGER NOT NULL CHECK (minuti > 0),
      richiesto_da TEXT,
      fuori_canone BOOLEAN NOT NULL DEFAULT false,
      richiesta_id INTEGER,
      lavoro_id INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS interventi_cliente ON interventi (cliente_id, data DESC)`;
  await sql`
    CREATE TABLE IF NOT EXISTS lavori (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      preventivo_id INTEGER,
      titolo TEXT NOT NULL,
      sito TEXT,
      stato TEXT NOT NULL DEFAULT 'da_avviare',
      inizio DATE,
      consegna_prevista DATE,
      completato_il DATE,
      ore_stimate DECIMAL(6,2),
      attesa_cliente TEXT,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS lavori_cliente ON lavori (cliente_id)`;
  await sql`
    CREATE TABLE IF NOT EXISTS richieste (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      sito TEXT,
      testo TEXT NOT NULL,
      urgente BOOLEAN NOT NULL DEFAULT false,
      stato TEXT NOT NULL DEFAULT 'nuova',
      ore_stimate DECIMAL(6,2),
      consegna_prevista DATE,
      risposta TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      stimata_il TIMESTAMPTZ,
      decisa_il TIMESTAMPTZ,
      completata_il TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS richieste_cliente ON richieste (cliente_id, created_at DESC)`;
  ensured = true;
}

export const STATI_LAVORO = ['da_avviare', 'in_corso', 'attesa_cliente', 'completato'] as const;
export type StatoLavoro = (typeof STATI_LAVORO)[number];
export const STATI_RICHIESTA = ['nuova', 'stimata', 'approvata', 'rifiutata', 'completata'] as const;
export type StatoRichiesta = (typeof STATI_RICHIESTA)[number];

export class ErroreCanone extends Error {}

const d = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v).slice(0, 10) : null);
const n = (v: unknown) => (v == null ? null : Number(v));

export interface Canone {
  id: number;
  cliente_id: number;
  ore_mese: number;
  prezzo_mese: number;
  tariffa_extra: number;
  inizio: string;
  fine: string | null;
  riporto_mesi: number;
  siti: string[];
  note: string | null;
}

export interface Intervento {
  id: number;
  data: string;
  sito: string | null;
  descrizione: string;
  minuti: number;
  richiesto_da: string | null;
  fuori_canone: boolean;
  richiesta_id: number | null;
  lavoro_id: number | null;
}

export interface Lavoro {
  id: number;
  preventivo_id: number | null;
  titolo: string;
  sito: string | null;
  stato: StatoLavoro;
  inizio: string | null;
  consegna_prevista: string | null;
  completato_il: string | null;
  ore_stimate: number | null;
  minuti_usati: number;
  attesa_cliente: string | null;
  note: string | null;
}

export interface Richiesta {
  id: number;
  sito: string | null;
  testo: string;
  urgente: boolean;
  stato: StatoRichiesta;
  ore_stimate: number | null;
  consegna_prevista: string | null;
  risposta: string | null;
  creata_il: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const aCanone = (r: any): Canone => ({
  id: r.id,
  cliente_id: r.cliente_id,
  ore_mese: Number(r.ore_mese),
  prezzo_mese: Number(r.prezzo_mese),
  tariffa_extra: Number(r.tariffa_extra),
  inizio: d(r.inizio)!,
  fine: d(r.fine),
  riporto_mesi: Number(r.riporto_mesi ?? 1),
  siti: r.siti ?? [],
  note: r.note ?? null,
});

export async function leggiCanone(clienteId: number): Promise<Canone | null> {
  await ensureCanoneSchema();
  const [r] = await sql`SELECT * FROM canoni WHERE cliente_id = ${clienteId}`;
  return r ? aCanone(r) : null;
}

export async function impostaCanone(
  clienteId: number,
  c: {
    ore_mese: number;
    prezzo_mese: number;
    tariffa_extra: number;
    inizio: string;
    fine?: string | null;
    riporto_mesi?: number;
    siti?: string[];
    note?: string | null;
  }
) {
  await ensureCanoneSchema();
  if (!(c.ore_mese > 0)) throw new ErroreCanone('Le ore al mese devono essere più di zero');
  if (!/^\d{4}-\d{2}/.test(c.inizio)) throw new ErroreCanone('Data di inizio non valida (YYYY-MM-DD)');
  const inizio = `${meseDi(c.inizio)}-01`;
  const [r] = await sql`
    INSERT INTO canoni (cliente_id, ore_mese, prezzo_mese, tariffa_extra, inizio, fine, riporto_mesi, siti, note)
    VALUES (${clienteId}, ${c.ore_mese}, ${c.prezzo_mese}, ${c.tariffa_extra}, ${inizio}, ${c.fine ?? null},
            ${c.riporto_mesi ?? 1}, ${c.siti ?? []}, ${c.note ?? null})
    ON CONFLICT (cliente_id) DO UPDATE SET
      ore_mese = EXCLUDED.ore_mese, prezzo_mese = EXCLUDED.prezzo_mese, tariffa_extra = EXCLUDED.tariffa_extra,
      inizio = EXCLUDED.inizio, fine = EXCLUDED.fine, riporto_mesi = EXCLUDED.riporto_mesi,
      siti = CASE WHEN ${c.siti === undefined} THEN canoni.siti ELSE EXCLUDED.siti END,
      note = CASE WHEN ${c.note === undefined} THEN canoni.note ELSE EXCLUDED.note END,
      updated_at = NOW()
    RETURNING *
  `;
  return aCanone(r);
}

// ── Interventi ──

export async function registraIntervento(
  clienteId: number,
  i: {
    data: string;
    minuti: number;
    descrizione: string;
    sito?: string | null;
    richiesto_da?: string | null;
    fuori_canone?: boolean;
    richiesta_id?: number | null;
    lavoro_id?: number | null;
  }
): Promise<Intervento> {
  await ensureCanoneSchema();
  if (!(i.minuti > 0)) throw new ErroreCanone('La durata deve essere più di zero');
  if (!i.descrizione?.trim()) throw new ErroreCanone('Manca la descrizione');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.data)) throw new ErroreCanone('Data non valida (YYYY-MM-DD)');
  const [r] = await sql`
    INSERT INTO interventi (cliente_id, data, sito, descrizione, minuti, richiesto_da, fuori_canone, richiesta_id, lavoro_id)
    VALUES (${clienteId}, ${i.data}, ${i.sito || null}, ${i.descrizione.trim()}, ${Math.round(i.minuti)},
            ${i.richiesto_da || null}, ${!!i.fuori_canone}, ${i.richiesta_id ?? null}, ${i.lavoro_id ?? null})
    RETURNING *
  `;
  return aIntervento(r);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const aIntervento = (r: any): Intervento => ({
  id: r.id,
  data: d(r.data)!,
  sito: r.sito,
  descrizione: r.descrizione,
  minuti: Number(r.minuti),
  richiesto_da: r.richiesto_da,
  fuori_canone: !!r.fuori_canone,
  richiesta_id: r.richiesta_id ?? null,
  lavoro_id: r.lavoro_id ?? null,
});

export async function eliminaIntervento(clienteId: number, id: number) {
  await ensureCanoneSchema();
  const r = await sql`DELETE FROM interventi WHERE id = ${id} AND cliente_id = ${clienteId} RETURNING id`;
  if (!r.length) throw new ErroreCanone(`Intervento ${id} non trovato`);
}

export async function listaInterventi(clienteId: number): Promise<Intervento[]> {
  await ensureCanoneSchema();
  const rows = await sql`SELECT * FROM interventi WHERE cliente_id = ${clienteId} ORDER BY data DESC, id DESC`;
  return rows.map(aIntervento);
}

// ── Lavori (timeline) ──

export async function salvaLavoro(
  clienteId: number,
  l: {
    id?: number;
    titolo?: string;
    preventivo_id?: number | null;
    sito?: string | null;
    stato?: StatoLavoro;
    inizio?: string | null;
    consegna_prevista?: string | null;
    completato_il?: string | null;
    ore_stimate?: number | null;
    attesa_cliente?: string | null;
    note?: string | null;
  }
) {
  await ensureCanoneSchema();
  if (l.stato && !STATI_LAVORO.includes(l.stato)) throw new ErroreCanone(`Stato non valido: ${l.stato}`);
  // Completato senza data: oggi.
  const completato = l.stato === 'completato' && l.completato_il === undefined ? new Date().toISOString().slice(0, 10) : l.completato_il;
  if (l.id == null) {
    if (!l.titolo?.trim()) throw new ErroreCanone('Manca il titolo del lavoro');
    const [r] = await sql`
      INSERT INTO lavori (cliente_id, preventivo_id, titolo, sito, stato, inizio, consegna_prevista, completato_il, ore_stimate, attesa_cliente, note)
      VALUES (${clienteId}, ${l.preventivo_id ?? null}, ${l.titolo.trim()}, ${l.sito ?? null}, ${l.stato ?? 'da_avviare'},
              ${l.inizio ?? null}, ${l.consegna_prevista ?? null}, ${completato ?? null}, ${l.ore_stimate ?? null},
              ${l.attesa_cliente ?? null}, ${l.note ?? null})
      RETURNING id
    `;
    return r.id as number;
  }
  const [vecchio] = await sql`SELECT * FROM lavori WHERE id = ${l.id} AND cliente_id = ${clienteId}`;
  if (!vecchio) throw new ErroreCanone(`Lavoro ${l.id} non trovato`);
  const v = <T,>(nuovo: T | undefined, prima: T) => (nuovo === undefined ? prima : nuovo);
  await sql`
    UPDATE lavori SET
      titolo = ${v(l.titolo, vecchio.titolo)},
      preventivo_id = ${v(l.preventivo_id, vecchio.preventivo_id)},
      sito = ${v(l.sito, vecchio.sito)},
      stato = ${v(l.stato, vecchio.stato)},
      inizio = ${v(l.inizio, d(vecchio.inizio))},
      consegna_prevista = ${v(l.consegna_prevista, d(vecchio.consegna_prevista))},
      completato_il = ${v(completato, d(vecchio.completato_il))},
      ore_stimate = ${v(l.ore_stimate, n(vecchio.ore_stimate))},
      attesa_cliente = ${v(l.attesa_cliente, vecchio.attesa_cliente)},
      note = ${v(l.note, vecchio.note)},
      updated_at = NOW()
    WHERE id = ${l.id}
  `;
  return l.id;
}

export async function eliminaLavoro(clienteId: number, id: number) {
  await ensureCanoneSchema();
  const r = await sql`DELETE FROM lavori WHERE id = ${id} AND cliente_id = ${clienteId} RETURNING id`;
  if (!r.length) throw new ErroreCanone(`Lavoro ${id} non trovato`);
  await sql`UPDATE interventi SET lavoro_id = NULL WHERE lavoro_id = ${id}`;
}

export async function listaLavori(clienteId: number): Promise<Lavoro[]> {
  await ensureCanoneSchema();
  const rows = await sql`
    SELECT l.*, COALESCE((SELECT sum(i.minuti) FROM interventi i WHERE i.lavoro_id = l.id), 0)::int AS minuti_usati
    FROM lavori l WHERE l.cliente_id = ${clienteId}
    ORDER BY (l.stato = 'completato'), COALESCE(l.consegna_prevista, l.inizio, l.created_at::date), l.id
  `;
  return rows.map((r) => ({
    id: r.id,
    preventivo_id: r.preventivo_id ?? null,
    titolo: r.titolo,
    sito: r.sito,
    stato: r.stato,
    inizio: d(r.inizio),
    consegna_prevista: d(r.consegna_prevista),
    completato_il: d(r.completato_il),
    ore_stimate: n(r.ore_stimate),
    minuti_usati: Number(r.minuti_usati),
    attesa_cliente: r.attesa_cliente,
    note: r.note,
  }));
}

// ── Richieste ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const aRichiesta = (r: any): Richiesta => ({
  id: r.id,
  sito: r.sito,
  testo: r.testo,
  urgente: !!r.urgente,
  stato: r.stato,
  ore_stimate: n(r.ore_stimate),
  consegna_prevista: d(r.consegna_prevista),
  risposta: r.risposta,
  creata_il: r.created_at ? new Date(r.created_at).toISOString() : null,
});

export async function listaRichieste(clienteId: number): Promise<Richiesta[]> {
  await ensureCanoneSchema();
  const rows = await sql`SELECT * FROM richieste WHERE cliente_id = ${clienteId} ORDER BY created_at DESC, id DESC`;
  return rows.map(aRichiesta);
}

export async function nuovaRichiesta(clienteId: number, r: { testo: string; sito?: string | null; urgente?: boolean }) {
  await ensureCanoneSchema();
  const testo = (r.testo ?? '').trim();
  if (testo.length < 3) throw new ErroreCanone('Descrivi la richiesta');
  if (testo.length > 4000) throw new ErroreCanone('La richiesta è troppo lunga');
  const [row] = await sql`
    INSERT INTO richieste (cliente_id, sito, testo, urgente)
    VALUES (${clienteId}, ${r.sito?.slice(0, 120) || null}, ${testo}, ${!!r.urgente})
    RETURNING *
  `;
  return aRichiesta(row);
}

/** Mauro risponde con una stima: la richiesta passa a "stimata" e il cliente può approvarla. */
export async function stimaRichiesta(
  clienteId: number,
  id: number,
  s: { ore_stimate: number; risposta?: string | null; consegna_prevista?: string | null }
) {
  await ensureCanoneSchema();
  if (!(s.ore_stimate > 0)) throw new ErroreCanone('La stima deve essere più di zero');
  const [r] = await sql`
    UPDATE richieste SET stato = 'stimata', ore_stimate = ${s.ore_stimate}, risposta = ${s.risposta ?? null},
      consegna_prevista = ${s.consegna_prevista ?? null}, stimata_il = NOW()
    WHERE id = ${id} AND cliente_id = ${clienteId} AND stato IN ('nuova', 'stimata')
    RETURNING *
  `;
  if (!r) throw new ErroreCanone(`Richiesta ${id} non trovata o già decisa`);
  return aRichiesta(r);
}

/** Il cliente approva o rifiuta una stima. */
export async function decidiRichiesta(clienteId: number, id: number, azione: 'approva' | 'rifiuta') {
  await ensureCanoneSchema();
  const stato = azione === 'approva' ? 'approvata' : 'rifiutata';
  const [r] = await sql`
    UPDATE richieste SET stato = ${stato}, decisa_il = NOW()
    WHERE id = ${id} AND cliente_id = ${clienteId} AND stato = 'stimata'
    RETURNING *
  `;
  if (!r) throw new ErroreCanone('Richiesta non trovata o non in attesa di approvazione');
  return aRichiesta(r);
}

/** Cambio di stato da parte di Mauro (es. completata, o approvata a voce). */
export async function impostaStatoRichiesta(clienteId: number, id: number, stato: StatoRichiesta) {
  await ensureCanoneSchema();
  if (!STATI_RICHIESTA.includes(stato)) throw new ErroreCanone(`Stato non valido: ${stato}`);
  const [r] = await sql`
    UPDATE richieste SET stato = ${stato},
      completata_il = CASE WHEN ${stato} = 'completata' THEN NOW() ELSE completata_il END,
      decisa_il = CASE WHEN ${stato} IN ('approvata', 'rifiutata') THEN COALESCE(decisa_il, NOW()) ELSE decisa_il END
    WHERE id = ${id} AND cliente_id = ${clienteId}
    RETURNING *
  `;
  if (!r) throw new ErroreCanone(`Richiesta ${id} non trovata`);
  return aRichiesta(r);
}

// ── Pagamenti in scadenza ──

export interface Scadenza {
  tipo: 'fattura' | 'tranche' | 'canone';
  descrizione: string;
  importo: number;
  data: string | null;
  pdf_url?: string | null;
}

export async function pagamentiInScadenza(clienteId: number, canone: Canone | null, meseCorrente: MeseCanone | null) {
  await ensureCanoneSchema();
  const out: Scadenza[] = [];
  const fatture = await sql`
    SELECT id, numero, importo, to_char(data, 'YYYY-MM-DD') AS data, pdf_url,
           GREATEST(0, COALESCE(importo, 0) - COALESCE((
             SELECT sum(pf.importo) FROM pagamenti_fattura pf WHERE pf.fattura_id = fatture.id
           ), 0) / 100.0)::float8 AS residuo
    FROM fatture WHERE cliente_id = ${clienteId} AND stato <> 'pagata'
    ORDER BY data NULLS LAST
  `;
  for (const f of fatture) {
    if (Number(f.residuo) <= 0) continue;
    out.push({
      tipo: 'fattura',
      descrizione: `Fattura${f.numero ? ` n. ${f.numero}` : ''}`,
      importo: Number(f.residuo),
      data: f.data,
      pdf_url: f.pdf_url,
    });
  }
  // Tranche non pagate dei preventivi accettati. Quelle già coperte da una fattura emessa
  // (anche da pagare) non si ripetono: compaiono come fattura.
  const preventivi = await sql`
    SELECT p.id, p.oggetto, p.totale, p.meta, p.tranches_stato,
           COALESCE((SELECT sum(f.importo) FROM fatture f WHERE f.preventivo_id = p.id), 0)::float8 AS fatturato
    FROM preventivi p
    WHERE p.cliente_id = ${clienteId} AND p.stato = 'accettato'
  `;
  for (const p of preventivi) {
    const totale = Number(p.totale) || 0;
    const tranches: { descrizione?: string; percentuale: number; pagato?: boolean }[] =
      p.tranches_stato?.length ? p.tranches_stato : (p.meta?.sezioni?.tranches ?? []);
    let cumulato = 0;
    for (const [k, t] of tranches.entries()) {
      const importo = Math.round(totale * Number(t.percentuale)) / 100;
      cumulato += importo;
      if (t.pagato || cumulato <= Number(p.fatturato) + 1) continue;
      out.push({
        tipo: 'tranche',
        descrizione: `${p.oggetto}: ${t.descrizione || `tranche ${k + 1}`} (${t.percentuale}%)`,
        importo,
        data: null,
      });
    }
  }
  if (canone && meseCorrente) {
    out.push({
      tipo: 'canone',
      descrizione: `Canone di ${nomeMese(meseCorrente.mese)}${meseCorrente.extra ? ` + ${fmtMinuti(meseCorrente.extra)} extra` : ""}`,
      importo: canone.prezzo_mese + meseCorrente.costo_extra,
      data: null,
    });
  }
  return out;
}

// ── Tutto per la pagina ──

export async function datiCanone(clienteId: number, oggi = new Date().toISOString().slice(0, 10)) {
  const canone = await leggiCanone(clienteId);
  const interventi = await listaInterventi(clienteId);
  const mesi = canone ? calcolaMesi(canone, interventi, oggi) : [];
  const corrente = mesi.find((m) => m.mese === meseDi(oggi)) ?? null;
  return {
    canone,
    mesi,
    corrente,
    interventi,
    lavori: await listaLavori(clienteId),
    richieste: await listaRichieste(clienteId),
    pagamenti: await pagamentiInScadenza(clienteId, canone, corrente),
  };
}
