import sql from '@/lib/db';
import { aperturaPartita, leggiPgn, type Review } from './partita';

// Tab Scacchi: partite (chess.com, PGN incollati, partite contro il bot), review del motore e commenti di Claude.

let ensured = false;

export async function ensureScacchiSchema() {
  if (ensured) return;
  // Stessa definizione di lib/schema.ts: la tab Scacchi non dipende dalle tabelle dei preventivi.
  await sql`
    CREATE TABLE IF NOT EXISTS impostazioni (
      chiave TEXT PRIMARY KEY,
      valore JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS scacchi_partite (
      id SERIAL PRIMARY KEY,
      fonte TEXT NOT NULL,
      url TEXT UNIQUE,
      pgn TEXT NOT NULL,
      bianco TEXT,
      nero TEXT,
      colore_mio TEXT,
      elo_bianco INTEGER,
      elo_nero INTEGER,
      risultato TEXT,
      esito_mio TEXT,
      cadenza TEXT,
      time_control TEXT,
      eco TEXT,
      apertura TEXT,
      mosse INTEGER NOT NULL DEFAULT 0,
      giocata_il TIMESTAMPTZ,
      review JSONB,
      accuratezza_mia NUMERIC(5,1),
      accuratezza_avv NUMERIC(5,1),
      analizzata_il TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS scacchi_partite_data ON scacchi_partite (giocata_il DESC)`;
  await sql`
    CREATE TABLE IF NOT EXISTS scacchi_commenti (
      id SERIAL PRIMARY KEY,
      partita_id INTEGER NOT NULL REFERENCES scacchi_partite(id) ON DELETE CASCADE,
      ply INTEGER NOT NULL,
      testo TEXT NOT NULL,
      linea TEXT[] NOT NULL DEFAULT '{}',
      autore TEXT NOT NULL DEFAULT 'claude',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (partita_id, ply)
    )
  `;
  ensured = true;
}

// ── Impostazioni ─────────────────────────────────────────────────────────

export type ImpostazioniScacchi = { username: string | null; ultimoArchivio: string | null };
const CHIAVE = 'scacchi';

export async function leggiImpostazioni(): Promise<ImpostazioniScacchi> {
  await ensureScacchiSchema();
  const [r] = await sql`SELECT valore FROM impostazioni WHERE chiave = ${CHIAVE}`;
  const v = (r?.valore ?? {}) as Partial<ImpostazioniScacchi>;
  return { username: v.username ?? null, ultimoArchivio: v.ultimoArchivio ?? null };
}

export async function salvaImpostazioni(p: Partial<ImpostazioniScacchi>) {
  const attuali = await leggiImpostazioni();
  const nuove = { ...attuali, ...p };
  if (p.username !== undefined && p.username !== attuali.username) nuove.ultimoArchivio = null;
  await sql`
    INSERT INTO impostazioni (chiave, valore, updated_at)
    VALUES (${CHIAVE}, ${JSON.stringify(nuove)}::jsonb, NOW())
    ON CONFLICT (chiave) DO UPDATE SET valore = EXCLUDED.valore, updated_at = NOW()
  `;
  return nuove;
}

// ── Partite ──────────────────────────────────────────────────────────────

export type NuovaPartita = {
  fonte: 'chesscom' | 'pgn' | 'bot';
  pgn: string;
  url?: string | null;
  cadenza?: string | null;
  /** Colore giocato da Mauro; se manca lo deduco dallo username chess.com. */
  coloreMio?: 'w' | 'b' | null;
  giocataIl?: string | null;
};

function esito(risultato: string | undefined, colore: 'w' | 'b' | null) {
  if (!colore || !risultato || risultato === '*') return null;
  if (risultato === '1/2-1/2') return 'patta';
  const vinceBianco = risultato === '1-0';
  return vinceBianco === (colore === 'w') ? 'vinta' : 'persa';
}

function dataDaIntestazioni(h: Record<string, string>): string | null {
  const d = (h.UTCDate || h.Date || '').replace(/\./g, '-');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const t = /^\d{2}:\d{2}:\d{2}$/.test(h.UTCTime || '') ? h.UTCTime : '12:00:00';
  return `${d}T${t}Z`;
}

/** Inserisce una partita. Restituisce l'id, o null se esiste già (stesso url). */
export async function salvaPartita(n: NuovaPartita): Promise<number | null> {
  await ensureScacchiSchema();
  const p = leggiPgn(n.pgn); // lancia se il PGN non è valido
  const h = p.intestazioni;
  let colore = n.coloreMio ?? null;
  if (!colore) {
    const { username } = await leggiImpostazioni();
    const u = username?.toLowerCase();
    if (u && h.White?.toLowerCase() === u) colore = 'w';
    else if (u && h.Black?.toLowerCase() === u) colore = 'b';
  }
  const ap = aperturaPartita(p);
  const num = (x?: string) => (x && /^\d+$/.test(x) ? Number(x) : null);
  const rows = await sql`
    INSERT INTO scacchi_partite
      (fonte, url, pgn, bianco, nero, colore_mio, elo_bianco, elo_nero, risultato, esito_mio,
       cadenza, time_control, eco, apertura, mosse, giocata_il)
    VALUES
      (${n.fonte}, ${n.url ?? h.Link ?? null}, ${n.pgn}, ${h.White ?? null}, ${h.Black ?? null}, ${colore},
       ${num(h.WhiteElo)}, ${num(h.BlackElo)}, ${h.Result ?? null}, ${esito(h.Result, colore)},
       ${n.cadenza ?? null}, ${h.TimeControl ?? null}, ${ap?.eco ?? h.ECO ?? null}, ${ap?.nome ?? null},
       ${p.mosse.length}, ${n.giocataIl ?? dataDaIntestazioni(h)})
    ON CONFLICT (url) DO NOTHING
    RETURNING id
  `;
  return rows[0]?.id ?? null;
}

export type RigaPartita = {
  id: number;
  fonte: string;
  url: string | null;
  bianco: string | null;
  nero: string | null;
  colore_mio: 'w' | 'b' | null;
  elo_bianco: number | null;
  elo_nero: number | null;
  risultato: string | null;
  esito_mio: 'vinta' | 'persa' | 'patta' | null;
  cadenza: string | null;
  eco: string | null;
  apertura: string | null;
  mosse: number;
  giocata_il: string | null;
  accuratezza_mia: number | null;
  accuratezza_avv: number | null;
  analizzata: boolean;
  commenti: number;
};

export type FiltriPartite = {
  esito?: 'vinta' | 'persa' | 'patta';
  apertura?: string;
  colore?: 'w' | 'b';
  cadenza?: string;
  analizzate?: boolean;
  limite?: number;
  offset?: number;
};

export async function listaPartite(f: FiltriPartite = {}): Promise<RigaPartita[]> {
  await ensureScacchiSchema();
  const ap = f.apertura ? `%${f.apertura}%` : null;
  const rows = await sql`
    SELECT p.id, p.fonte, p.url, p.bianco, p.nero, p.colore_mio, p.elo_bianco, p.elo_nero, p.risultato,
           p.esito_mio, p.cadenza, p.eco, p.apertura, p.mosse, p.giocata_il,
           p.accuratezza_mia::float AS accuratezza_mia, p.accuratezza_avv::float AS accuratezza_avv,
           (p.review IS NOT NULL) AS analizzata,
           (SELECT COUNT(*)::int FROM scacchi_commenti c WHERE c.partita_id = p.id) AS commenti
    FROM scacchi_partite p
    WHERE (${f.esito ?? null}::text IS NULL OR p.esito_mio = ${f.esito ?? null})
      AND (${ap}::text IS NULL OR p.apertura ILIKE ${ap} OR p.eco ILIKE ${ap})
      AND (${f.colore ?? null}::text IS NULL OR p.colore_mio = ${f.colore ?? null})
      AND (${f.cadenza ?? null}::text IS NULL OR p.cadenza = ${f.cadenza ?? null})
      AND (${f.analizzate ?? null}::boolean IS NULL OR (p.review IS NOT NULL) = ${f.analizzate ?? null})
    ORDER BY p.giocata_il DESC NULLS LAST, p.id DESC
    LIMIT ${f.limite ?? 50} OFFSET ${f.offset ?? 0}
  `;
  return rows as RigaPartita[];
}

export type Commento = { ply: number; testo: string; linea: string[]; autore: string };

export type PartitaCompleta = RigaPartita & { pgn: string; review: Review | null; commentiLista: Commento[] };

export async function leggiPartita(id: number): Promise<PartitaCompleta | null> {
  await ensureScacchiSchema();
  const [p] = await sql`
    SELECT p.*, p.accuratezza_mia::float AS accuratezza_mia, p.accuratezza_avv::float AS accuratezza_avv,
           (p.review IS NOT NULL) AS analizzata
    FROM scacchi_partite p WHERE p.id = ${id}
  `;
  if (!p) return null;
  const commenti = await sql`
    SELECT ply, testo, linea, autore FROM scacchi_commenti WHERE partita_id = ${id} ORDER BY ply
  `;
  return { ...(p as PartitaCompleta), commenti: commenti.length, commentiLista: commenti as Commento[] };
}

export async function salvaReview(id: number, review: Review) {
  await ensureScacchiSchema();
  const [p] = await sql`SELECT colore_mio FROM scacchi_partite WHERE id = ${id}`;
  if (!p) throw new Error('Partita non trovata');
  // Senza colore noto non so quale accuratezza è la mia: la imposta impostaColore.
  const mio = p.colore_mio as 'w' | 'b' | null;
  const avv = mio === 'w' ? 'b' : 'w';
  await sql`
    UPDATE scacchi_partite
    SET review = ${JSON.stringify(review)}::jsonb,
        accuratezza_mia = ${mio ? review.accuratezza[mio] : null},
        accuratezza_avv = ${mio ? review.accuratezza[avv] : null},
        analizzata_il = NOW()
    WHERE id = ${id}
  `;
}

export async function impostaColore(id: number, colore: 'w' | 'b') {
  await ensureScacchiSchema();
  const [p] = await sql`SELECT risultato, review FROM scacchi_partite WHERE id = ${id}`;
  if (!p) throw new Error('Partita non trovata');
  const r = p.review as Review | null;
  const avv = colore === 'w' ? 'b' : 'w';
  await sql`
    UPDATE scacchi_partite
    SET colore_mio = ${colore}, esito_mio = ${esito(p.risultato, colore)},
        accuratezza_mia = ${r?.accuratezza[colore] ?? null}, accuratezza_avv = ${r?.accuratezza[avv] ?? null}
    WHERE id = ${id}
  `;
}

export async function eliminaPartita(id: number) {
  await ensureScacchiSchema();
  await sql`DELETE FROM scacchi_partite WHERE id = ${id}`;
}

// ── Commenti (scritti da Claude via MCP, o a mano) ───────────────────────

export async function salvaCommenti(partitaId: number, commenti: { ply: number; testo: string; linea?: string[] }[], autore = 'claude') {
  await ensureScacchiSchema();
  const [p] = await sql`SELECT mosse FROM scacchi_partite WHERE id = ${partitaId}`;
  if (!p) throw new Error('Partita non trovata');
  for (const c of commenti) {
    if (c.ply < 0 || c.ply > p.mosse) throw new Error(`Ply ${c.ply} fuori dalla partita (0-${p.mosse})`);
  }
  for (const c of commenti) {
    await sql`
      INSERT INTO scacchi_commenti (partita_id, ply, testo, linea, autore)
      VALUES (${partitaId}, ${c.ply}, ${c.testo}, ${c.linea ?? []}, ${autore})
      ON CONFLICT (partita_id, ply) DO UPDATE SET testo = EXCLUDED.testo, linea = EXCLUDED.linea,
        autore = EXCLUDED.autore, created_at = NOW()
    `;
  }
  return commenti.length;
}

export async function eliminaCommento(partitaId: number, ply: number) {
  await ensureScacchiSchema();
  await sql`DELETE FROM scacchi_commenti WHERE partita_id = ${partitaId} AND ply = ${ply}`;
}
