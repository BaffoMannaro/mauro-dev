import sql from '@/lib/db';
import { ensureScacchiSchema, type RigaPartita } from './db';
import { aderenza, persaPerTempo, PROGRAMMA, type Aderenza, type RegoleMissione } from './coach';
import type { Review } from './partita';
import { REPERTORIO } from './repertorio';

// Missioni del coach e avanzamento dei drill sul repertorio.

let ensured = false;

export async function ensureMissioniSchema() {
  await ensureScacchiSchema();
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS scacchi_missioni (
      id SERIAL PRIMARY KEY,
      codice TEXT,
      titolo TEXT NOT NULL,
      descrizione TEXT NOT NULL,
      regole JSONB NOT NULL,
      stato TEXT NOT NULL DEFAULT 'attiva',
      inizio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      fine TIMESTAMPTZ,
      feedback TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS scacchi_drill (
      linea_id TEXT PRIMARY KEY,
      livello INTEGER NOT NULL DEFAULT 0,
      ripassi INTEGER NOT NULL DEFAULT 0,
      errori INTEGER NOT NULL DEFAULT 0,
      ultimo TIMESTAMPTZ,
      prossimo TIMESTAMPTZ
    )
  `;
  ensured = true;
}

// ── Drill (ripetizione spaziata semplice) ─────────────────────────────

/** Giorni di attesa per livello: dopo un ripasso perfetto si sale di livello. */
const INTERVALLI = [0, 1, 3, 7, 14, 30];

export type StatoDrill = { linea_id: string; livello: number; ripassi: number; errori: number; ultimo: string | null; prossimo: string | null };

export async function statoDrill(): Promise<Record<string, StatoDrill>> {
  await ensureMissioniSchema();
  const rows = (await sql`SELECT * FROM scacchi_drill`) as StatoDrill[];
  return Object.fromEntries(rows.map((r) => [r.linea_id, r]));
}

/** Registra un ripasso: errori = mosse sbagliate nel giro. Zero errori fa salire di livello. */
export async function registraRipasso(lineaId: string, errori: number) {
  if (!REPERTORIO.some((l) => l.id === lineaId)) throw new Error('Linea sconosciuta');
  await ensureMissioniSchema();
  const [r] = await sql`SELECT livello FROM scacchi_drill WHERE linea_id = ${lineaId}`;
  const prima = (r?.livello as number | undefined) ?? 0;
  const livello = errori === 0 ? Math.min(prima + 1, INTERVALLI.length - 1) : Math.max(0, prima - 1);
  const giorni = errori === 0 ? INTERVALLI[livello] : 0;
  await sql`
    INSERT INTO scacchi_drill (linea_id, livello, ripassi, errori, ultimo, prossimo)
    VALUES (${lineaId}, ${livello}, 1, ${errori}, NOW(), NOW() + make_interval(days => ${giorni}))
    ON CONFLICT (linea_id) DO UPDATE SET livello = EXCLUDED.livello, ripassi = scacchi_drill.ripassi + 1,
      errori = scacchi_drill.errori + EXCLUDED.errori, ultimo = NOW(), prossimo = EXCLUDED.prossimo
  `;
  return { livello, prossimo_tra_giorni: giorni };
}

/** Una linea è "imparata" per le missioni quando ha almeno un ripasso perfetto (livello >= 1). */
export function imparata(s?: StatoDrill) {
  return !!s && s.livello >= 1;
}

// ── Missioni ─────────────────────────────────────────────────────────

export type Missione = {
  id: number;
  codice: string | null;
  titolo: string;
  descrizione: string;
  regole: RegoleMissione;
  stato: 'attiva' | 'completata' | 'annullata';
  inizio: string;
  fine: string | null;
  feedback: string | null;
};

export async function listaMissioni(): Promise<Missione[]> {
  await ensureMissioniSchema();
  return (await sql`SELECT * FROM scacchi_missioni ORDER BY inizio DESC, id DESC`) as Missione[];
}

export async function missioneAttiva(): Promise<Missione | null> {
  await ensureMissioniSchema();
  const [m] = await sql`SELECT * FROM scacchi_missioni WHERE stato = 'attiva' ORDER BY inizio DESC LIMIT 1`;
  return (m as Missione) ?? null;
}

export async function creaMissione(m: { codice?: string | null; titolo: string; descrizione: string; regole: RegoleMissione }) {
  await ensureMissioniSchema();
  const sconosciute = m.regole.linee.filter((id) => !REPERTORIO.some((l) => l.id === id));
  if (sconosciute.length) throw new Error(`Linee sconosciute: ${sconosciute.join(', ')}`);
  // Una sola missione attiva alla volta.
  await sql`UPDATE scacchi_missioni SET stato = 'annullata', fine = NOW() WHERE stato = 'attiva'`;
  const [r] = await sql`
    INSERT INTO scacchi_missioni (codice, titolo, descrizione, regole)
    VALUES (${m.codice ?? null}, ${m.titolo}, ${m.descrizione}, ${JSON.stringify(m.regole)}::jsonb)
    RETURNING id
  `;
  return r.id as number;
}

/** Attiva la prossima missione del programma non ancora completata. */
export async function attivaProssima() {
  const fatte = new Set((await listaMissioni()).filter((m) => m.stato === 'completata').map((m) => m.codice));
  const p = PROGRAMMA.find((x) => !fatte.has(x.codice));
  if (!p) throw new Error('Programma completato: chiedi a Claude una missione nuova');
  return creaMissione(p);
}

export async function chiudiMissione(id: number, stato: 'completata' | 'annullata', feedback?: string) {
  await ensureMissioniSchema();
  await sql`
    UPDATE scacchi_missioni SET stato = ${stato}, fine = NOW(), feedback = COALESCE(${feedback ?? null}, feedback)
    WHERE id = ${id}
  `;
}

export async function salvaFeedback(id: number, feedback: string) {
  await ensureMissioniSchema();
  await sql`UPDATE scacchi_missioni SET feedback = ${feedback} WHERE id = ${id}`;
}

export type PartitaMissione = Pick<
  RigaPartita,
  'id' | 'bianco' | 'nero' | 'colore_mio' | 'esito_mio' | 'apertura' | 'eco' | 'giocata_il' | 'accuratezza_mia' | 'cadenza'
> & { aderenza: Aderenza; persaPerTempo: boolean; gravi: number | null; analizzata: boolean };

export type Avanzamento = {
  missione: Missione;
  partite: PartitaMissione[];
  giocate: number;
  inRegola: number;
  vinte: number;
  perse: number;
  patte: number;
  persePerTempo: number;
  analizzate: number;
  accuratezzaMedia: number | null;
  graviMedi: number | null;
  deviazioni: { mossa: string; attesa: string; volte: number }[];
  obiettivi: { testo: string; ok: boolean | null }[];
  completa: boolean;
};

export async function avanzamento(m: Missione): Promise<Avanzamento> {
  await ensureMissioniSchema();
  const cad = m.regole.cadenze ?? [];
  const rows = await sql`
    SELECT id, bianco, nero, colore_mio, esito_mio, apertura, eco, giocata_il, cadenza, pgn, review,
           accuratezza_mia::float AS accuratezza_mia
    FROM scacchi_partite
    WHERE colore_mio IS NOT NULL AND giocata_il >= ${m.inizio}
      AND (${m.fine}::timestamptz IS NULL OR giocata_il <= ${m.fine})
      AND (cardinality(${cad}::text[]) = 0 OR cadenza = ANY(${cad}::text[]))
    ORDER BY giocata_il ASC
    LIMIT ${m.regole.partite}
  `;
  const partite: PartitaMissione[] = rows.map((r) => {
    const review = r.review as Review | null;
    const colore = r.colore_mio as 'w' | 'b';
    return {
      id: r.id,
      bianco: r.bianco,
      nero: r.nero,
      colore_mio: colore,
      esito_mio: r.esito_mio,
      apertura: r.apertura,
      eco: r.eco,
      giocata_il: r.giocata_il,
      cadenza: r.cadenza,
      accuratezza_mia: r.accuratezza_mia,
      aderenza: aderenza(r.pgn, colore, m.regole.linee),
      persaPerTempo: persaPerTempo(r.pgn, colore),
      gravi: review ? review.conteggi[colore].grave : null,
      analizzata: !!review,
    };
  });
  const n = partite.length;
  const conta = (f: (p: PartitaMissione) => boolean) => partite.filter(f).length;
  const acc = partite.filter((p) => p.accuratezza_mia !== null).map((p) => Number(p.accuratezza_mia));
  const gr = partite.filter((p) => p.gravi !== null).map((p) => p.gravi as number);
  const dev = new Map<string, { mossa: string; attesa: string; volte: number }>();
  for (const p of partite) {
    const d = p.aderenza.deviazione;
    if (!d) continue;
    const k = `${d.attesa}|${d.giocata}`;
    const x = dev.get(k) ?? { mossa: d.giocata, attesa: d.attesa, volte: 0 };
    x.volte++;
    dev.set(k, x);
  }
  const r = m.regole;
  const inRegola = conta((p) => p.aderenza.inRegola);
  const persePerTempo = conta((p) => p.persaPerTempo);
  const graviMedi = gr.length ? Math.round((gr.reduce((s, x) => s + x, 0) / gr.length) * 10) / 10 : null;
  const finita = n >= r.partite;
  const obiettivi: { testo: string; ok: boolean | null }[] = [{ testo: `${r.partite} partite giocate`, ok: finita ? true : null }];
  if (r.minInRegola !== undefined) obiettivi.push({ testo: `Almeno ${r.minInRegola} partite nel repertorio`, ok: finita ? inRegola >= r.minInRegola : null });
  if (r.maxPersePerTempo !== undefined)
    obiettivi.push({ testo: r.maxPersePerTempo === 0 ? 'Nessuna partita persa per tempo' : `Al massimo ${r.maxPersePerTempo} perse per tempo`, ok: persePerTempo > r.maxPersePerTempo ? false : finita ? true : null });
  if (r.maxGraviMedi !== undefined)
    obiettivi.push({ testo: `Al massimo ${r.maxGraviMedi} errore grave per partita (media)`, ok: finita && gr.length === n ? (graviMedi ?? 0) <= r.maxGraviMedi : null });
  return {
    missione: m,
    partite,
    giocate: n,
    inRegola,
    vinte: conta((p) => p.esito_mio === 'vinta'),
    perse: conta((p) => p.esito_mio === 'persa'),
    patte: conta((p) => p.esito_mio === 'patta'),
    persePerTempo,
    analizzate: conta((p) => p.analizzata),
    accuratezzaMedia: acc.length ? Math.round((acc.reduce((s, x) => s + x, 0) / acc.length) * 10) / 10 : null,
    graviMedi,
    deviazioni: [...dev.values()].sort((a, b) => b.volte - a.volte),
    obiettivi,
    completa: finita && obiettivi.every((o) => o.ok !== false),
  };
}
