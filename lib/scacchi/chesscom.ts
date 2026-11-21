// Import partite dall'API pubblica di chess.com (nessuna chiave, solo partite pubbliche).
// Docs: https://www.chess.com/news/view/published-data-api
import { leggiImpostazioni, salvaImpostazioni, salvaPartita } from './db';

const BASE = 'https://api.chess.com/pub/player';
const HEADERS = { 'User-Agent': 'maurodev-scacchi/1.0', Accept: 'application/json' };

type GiocoChesscom = {
  url: string;
  pgn?: string;
  time_class?: string;
  rules?: string;
  end_time?: number;
  white?: { username: string };
  black?: { username: string };
};

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: HEADERS, cache: 'no-store' });
  if (r.status === 404) throw new Error('Utente chess.com non trovato');
  if (!r.ok) throw new Error(`chess.com ha risposto ${r.status}`);
  return (await r.json()) as T;
}

export type EsitoImport = { importate: number; gia_presenti: number; scartate: number; mesi: string[] };

/**
 * Importa le partite dei mesi non ancora sincronizzati (il mese più recente si rilegge sempre).
 * Al primo import prende al massimo `mesiIniziali` mesi.
 */
export async function importaChesscom(opts: { username?: string; mesiIniziali?: number } = {}): Promise<EsitoImport> {
  const imp = await leggiImpostazioni();
  const username = (opts.username ?? imp.username ?? '').trim().toLowerCase();
  if (!username) throw new Error('Imposta prima lo username chess.com');
  if (username !== imp.username) await salvaImpostazioni({ username });

  const { archives } = await getJson<{ archives: string[] }>(`${BASE}/${encodeURIComponent(username)}/games/archives`);
  const ultimo = username === imp.username ? imp.ultimoArchivio : null;
  let daLeggere = ultimo ? archives.filter((a) => a >= ultimo) : archives.slice(-(opts.mesiIniziali ?? 6));
  if (daLeggere.length === 0 && archives.length) daLeggere = archives.slice(-1);

  const esito = await importaArchivi(username, daLeggere);
  if (archives.length) await salvaImpostazioni({ username, ultimoArchivio: archives[archives.length - 1] });
  return esito;
}

/** Elenco degli archivi mensili del giocatore (URL), dal più vecchio al più recente. */
export async function elencoArchivi(username?: string): Promise<{ username: string; archivi: string[] }> {
  const imp = await leggiImpostazioni();
  const u = (username ?? imp.username ?? '').trim().toLowerCase();
  if (!u) throw new Error('Imposta prima lo username chess.com');
  if (u !== imp.username) await salvaImpostazioni({ username: u });
  const { archives } = await getJson<{ archives: string[] }>(`${BASE}/${encodeURIComponent(u)}/games/archives`);
  return { username: u, archivi: archives };
}

/** Importa gli archivi indicati (blocchi piccoli: ogni chiamata deve restare sotto il limite di tempo delle funzioni). */
export async function importaArchivi(username: string, archivi: string[]): Promise<EsitoImport> {
  const valido = `${BASE}/${encodeURIComponent(username)}/games/`;
  if (archivi.some((a) => !a.startsWith(valido))) throw new Error('Archivio non valido');
  const esito: EsitoImport = { importate: 0, gia_presenti: 0, scartate: 0, mesi: [] };
  for (const a of archivi) {
    const { games } = await getJson<{ games: GiocoChesscom[] }>(a);
    esito.mesi.push(a.split('/games/')[1] ?? a);
    for (const g of games) {
      if (!g.pgn || (g.rules && g.rules !== 'chess')) {
        esito.scartate++;
        continue;
      }
      const colore = g.white?.username?.toLowerCase() === username ? 'w' : g.black?.username?.toLowerCase() === username ? 'b' : null;
      try {
        const id = await salvaPartita({
          fonte: 'chesscom',
          pgn: g.pgn,
          url: g.url,
          cadenza: g.time_class ?? null,
          coloreMio: colore,
          giocataIl: g.end_time ? new Date(g.end_time * 1000).toISOString() : null,
        });
        if (id) esito.importate++;
        else esito.gia_presenti++;
      } catch {
        esito.scartate++;
      }
    }
  }
  return esito;
}

/** Segna come sincronizzato fino all'ultimo archivio (dopo l'import completo). */
export async function segnaSincronizzato(username: string, ultimo: string) {
  await salvaImpostazioni({ username, ultimoArchivio: ultimo });
}
