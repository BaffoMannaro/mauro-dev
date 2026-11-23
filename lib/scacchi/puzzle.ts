import sql from '@/lib/db';
import { ensureScacchiSchema } from './db';
import type { Review } from './partita';
import { probPer } from './classifica';
import { registraAllenamento } from './allenamento';

// Puzzle dai propri errori: posizioni dove Mauro ha sbagliato (errore o grave) e la mossa giusta era l'unica buona.
// Ripetizione spaziata come i drill del repertorio.

let ensured = false;

export async function ensurePuzzleSchema() {
  await ensureScacchiSchema();
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS scacchi_puzzle (
      id SERIAL PRIMARY KEY,
      partita_id INTEGER NOT NULL REFERENCES scacchi_partite(id) ON DELETE CASCADE,
      ply INTEGER NOT NULL,
      fen TEXT NOT NULL,
      colore TEXT NOT NULL,
      soluzione TEXT NOT NULL,
      soluzione_san TEXT NOT NULL,
      linea TEXT[] NOT NULL DEFAULT '{}',
      giocata_san TEXT NOT NULL,
      perdita NUMERIC(5,3) NOT NULL,
      tema TEXT NOT NULL,
      livello INTEGER NOT NULL DEFAULT 0,
      tentativi INTEGER NOT NULL DEFAULT 0,
      risolti INTEGER NOT NULL DEFAULT 0,
      prossimo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (partita_id, ply)
    )
  `;
  ensured = true;
}

export type CandidatoPuzzle = {
  ply: number;
  fen: string;
  colore: 'w' | 'b';
  soluzione: string;
  soluzione_san: string;
  linea: string[];
  giocata_san: string;
  perdita: number;
  tema: string;
};

/** Margine minimo tra la mossa migliore e la seconda perché la soluzione sia "unica". */
export const MARGINE_UNICA = 0.15;

/** Puzzle candidati di una partita analizzata (pura: niente DB). */
export function candidatiPuzzle(review: Review, colore: 'w' | 'b'): CandidatoPuzzle[] {
  const out: CandidatoPuzzle[] = [];
  for (const m of review.mosse) {
    if (m.colore !== colore || !['errore', 'grave', 'mancata'].includes(m.classificazione)) continue;
    if (!m.migliore || !m.migliorSan || m.migliore === m.uci) continue;
    const mattoMio = m.evalPrima.mate !== null && (colore === 'w' ? m.evalPrima.mate > 0 : m.evalPrima.mate < 0);
    let unica = mattoMio;
    if (!unica && m.secondaPrima) unica = probPer(colore, m.evalPrima) - probPer(colore, m.secondaPrima) >= MARGINE_UNICA;
    if (!unica) continue;
    const tema = mattoMio ? 'Matto' : m.migliorSan.includes('x') ? 'Cattura' : m.migliorSan.includes('+') ? 'Scacco' : 'Mossa tranquilla';
    out.push({
      ply: m.ply,
      fen: m.fenPrima,
      colore,
      soluzione: m.migliore,
      soluzione_san: m.migliorSan,
      linea: m.pvMigliore.slice(0, 6),
      giocata_san: m.san,
      perdita: Math.round(m.perdita * 1000) / 1000,
      tema,
    });
  }
  return out;
}

/** Crea i puzzle mancanti dalle partite analizzate. Restituisce quanti ne ha aggiunti. */
export async function sincronizzaPuzzle(): Promise<number> {
  await ensurePuzzleSchema();
  const righe = await sql`
    SELECT p.id, p.colore_mio, p.review FROM scacchi_partite p
    WHERE p.review IS NOT NULL AND p.colore_mio IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM scacchi_puzzle z WHERE z.partita_id = p.id)
  `;
  let n = 0;
  for (const r of righe) {
    for (const c of candidatiPuzzle(r.review as Review, r.colore_mio)) {
      const ins = await sql`
        INSERT INTO scacchi_puzzle (partita_id, ply, fen, colore, soluzione, soluzione_san, linea, giocata_san, perdita, tema)
        VALUES (${r.id}, ${c.ply}, ${c.fen}, ${c.colore}, ${c.soluzione}, ${c.soluzione_san}, ${c.linea}, ${c.giocata_san}, ${c.perdita}, ${c.tema})
        ON CONFLICT (partita_id, ply) DO NOTHING RETURNING id
      `;
      n += ins.length;
    }
  }
  return n;
}

export type Puzzle = CandidatoPuzzle & {
  id: number;
  partita_id: number;
  livello: number;
  tentativi: number;
  risolti: number;
  prossimo: string;
};

export async function puzzleDaFare(limite = 20): Promise<Puzzle[]> {
  await ensurePuzzleSchema();
  return (await sql`
    SELECT id, partita_id, ply, fen, colore, soluzione, soluzione_san, linea, giocata_san, perdita::float AS perdita, tema,
           livello, tentativi, risolti, prossimo
    FROM scacchi_puzzle WHERE prossimo <= NOW()
    ORDER BY livello ASC, perdita DESC, id ASC LIMIT ${limite}
  `) as Puzzle[];
}

export async function riepilogoPuzzle() {
  await ensurePuzzleSchema();
  const [r] = await sql`
    SELECT COUNT(*)::int AS totali,
           COUNT(*) FILTER (WHERE prossimo <= NOW())::int AS da_fare,
           COUNT(*) FILTER (WHERE livello >= 3)::int AS imparati,
           COALESCE(SUM(tentativi), 0)::int AS tentativi,
           COALESCE(SUM(risolti), 0)::int AS risolti
    FROM scacchi_puzzle
  `;
  const temi = await sql`SELECT tema, COUNT(*)::int AS n FROM scacchi_puzzle GROUP BY tema ORDER BY n DESC`;
  return { ...(r as { totali: number; da_fare: number; imparati: number; tentativi: number; risolti: number }), temi: temi as { tema: string; n: number }[] };
}

const INTERVALLI = [0, 1, 3, 7, 14, 30];

/** Registra un tentativo: risolto al primo colpo fa salire di livello, altrimenti si riparte e torna domani. */
export async function registraTentativo(id: number, risolto: boolean) {
  await ensurePuzzleSchema();
  const [p] = await sql`SELECT livello FROM scacchi_puzzle WHERE id = ${id}`;
  if (!p) throw new Error('Puzzle non trovato');
  const livello = risolto ? Math.min((p.livello as number) + 1, INTERVALLI.length - 1) : 0;
  const giorni = risolto ? INTERVALLI[livello] : 1;
  await sql`
    UPDATE scacchi_puzzle SET livello = ${livello}, tentativi = tentativi + 1, risolti = risolti + ${risolto ? 1 : 0},
      prossimo = NOW() + make_interval(days => ${giorni})
    WHERE id = ${id}
  `;
  await registraAllenamento('puzzle', String(id), risolto);
  return { livello, prossimo_tra_giorni: giorni };
}
