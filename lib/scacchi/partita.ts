// Lettura di PGN e costruzione della Game Review a partire dalle valutazioni del motore.
import { Chess } from 'chess.js';
import aperture from './aperture.json';
import {
  accuratezzaPartita,
  bilancioMateriale,
  classificaMossa,
  type Classificazione,
  type Valutazione,
} from './classifica';

export type Ply = {
  ply: number; // 1 = prima mossa del Bianco
  colore: 'w' | 'b';
  san: string;
  uci: string;
  fenPrima: string;
  fenDopo: string;
  /** Secondi rimasti sull'orologio dopo la mossa (dal commento [%clk] di chess.com), se presente. */
  clk?: number | null;
};

export type PartitaLetta = {
  intestazioni: Record<string, string>;
  /** Tempo base in secondi (TimeControl "600" o "600+5"), se noto. */
  tempoBase?: number | null;
  fenIniziale: string;
  mosse: Ply[];
};

const CATALOGO = aperture as unknown as Record<string, [string, string, string]>;

export function epd(fen: string) {
  return fen.split(' ').slice(0, 4).join(' ');
}

export function apertura(fen: string): { eco: string; nome: string; mosse: string } | null {
  const r = CATALOGO[epd(fen)];
  return r ? { eco: r[0], nome: r[1], mosse: r[2] } : null;
}

export function leggiPgn(pgn: string): PartitaLetta {
  const c = new Chess();
  c.loadPgn(pgn);
  const intestazioni = c.getHeaders() as Record<string, string>;
  const storia = c.history({ verbose: true });
  const fenIniziale = storia.length ? storia[0].before : c.fen();
  // Orologio: chess.com scrive {[%clk 0:09:58.5]} dopo ogni mossa; la FEN completa identifica la posizione.
  const orologio = new Map<string, number>();
  for (const { fen, comment } of c.getComments()) {
    const t = /\[%clk (\d+):(\d+):(\d+(?:\.\d+)?)\]/.exec(comment ?? '');
    if (t) orologio.set(fen, Number(t[1]) * 3600 + Number(t[2]) * 60 + Number(t[3]));
  }
  const mosse: Ply[] = storia.map((m, i) => ({
    ply: i + 1,
    colore: m.color,
    san: m.san,
    uci: m.from + m.to + (m.promotion ?? ''),
    fenPrima: m.before,
    fenDopo: m.after,
    clk: orologio.get(m.after) ?? null,
  }));
  const base = /^(\d+)/.exec(intestazioni.TimeControl ?? '');
  return { intestazioni, fenIniziale, mosse, tempoBase: base ? Number(base[1]) : null };
}

/** Apertura più profonda raggiunta nella partita (dal catalogo ECO). */
export function aperturaPartita(p: PartitaLetta): { eco: string; nome: string; ultimoPly: number } | null {
  let trovata: { eco: string; nome: string; ultimoPly: number } | null = null;
  for (const m of p.mosse) {
    const a = apertura(m.fenDopo);
    if (a) trovata = { eco: a.eco, nome: a.nome, ultimoPly: m.ply };
    else if (m.ply > 30) break;
  }
  return trovata;
}

/** Analisi del motore di UNA posizione. */
export type AnalisiPosizione = {
  fen: string;
  eval: Valutazione;
  migliore: string | null; // uci
  pv: string[]; // uci
  seconda?: Valutazione | null;
  profondita?: number;
};

export type MossaReview = Ply & {
  evalPrima: Valutazione;
  /** Seconda miglior linea della posizione prima (serve a riconoscere le mosse uniche). */
  secondaPrima?: Valutazione | null;
  evalDopo: Valutazione;
  migliore: string | null;
  migliorSan: string | null;
  pvMigliore: string[]; // san, dalla posizione prima
  classificazione: Classificazione;
  perdita: number;
  accuratezza: number;
};

export type Review = {
  /** 2 = con la classe "mancata" e i tempi. */
  versione?: number;
  mosse: MossaReview[];
  accuratezza: { w: number | null; b: number | null };
  conteggi: { w: Record<Classificazione, number>; b: Record<Classificazione, number> };
};

function uciToSan(fen: string, linea: string[], max = 8): string[] {
  const c = new Chess(fen);
  const out: string[] = [];
  for (const u of linea.slice(0, max)) {
    try {
      const m = c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
      out.push(m.san);
    } catch {
      break;
    }
  }
  return out;
}

/** Materiale sacrificato da chi muove: confronto prima della mossa e dopo la risposta migliore + la nostra replica. */
function sacrificio(m: Ply, dopo: AnalisiPosizione): number {
  const prima = bilancioMateriale(m.fenPrima, m.colore);
  const c = new Chess(m.fenDopo);
  for (const u of dopo.pv.slice(0, 2)) {
    try {
      c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    } catch {
      break;
    }
  }
  return prima - bilancioMateriale(c.fen(), m.colore);
}

/** Bilancio di materiale per `colore` dopo aver giocato fino a `n` mosse (uci) da `fen`. */
function materialeDopo(fen: string, linea: string[], n: number, colore: 'w' | 'b'): number {
  const c = new Chess(fen);
  for (const u of linea.slice(0, n)) {
    try {
      c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    } catch {
      break;
    }
  }
  return bilancioMateriale(c.fen(), colore);
}

function contatori(): Record<Classificazione, number> {
  return { libro: 0, brillante: 0, ottima: 0, migliore: 0, eccellente: 0, buona: 0, imprecisione: 0, errore: 0, grave: 0, mancata: 0 };
}

/**
 * Costruisce la review. `analisi[i]` è la posizione prima del ply i+1; serve anche l'ultima (dopo l'ultima mossa).
 * Quindi analisi.length === mosse.length + 1.
 */
export function costruisciReview(p: PartitaLetta, analisi: AnalisiPosizione[]): Review {
  const mosse: MossaReview[] = [];
  const acc: { w: number[]; b: number[] } = { w: [], b: [] };
  const conteggi = { w: contatori(), b: contatori() };
  let inLibro = true;

  p.mosse.forEach((m, i) => {
    const a = analisi[i];
    const d = analisi[i + 1];
    if (!a || !d) return;
    const matto = new Chess(m.fenDopo).isCheckmate();
    const libro = inLibro && apertura(m.fenDopo) !== null;
    if (!libro) inLibro = false;
    const esito = classificaMossa({
      colore: m.colore,
      giocata: m.uci,
      prima: a.eval,
      secondaPrima: a.seconda ?? null,
      migliore: a.migliore,
      dopo: d.eval,
      libro,
      sacrificio: sacrificio(m, d),
      matto,
      mattoPerso:
        !matto &&
        a.eval.mate !== null &&
        (m.colore === 'w' ? a.eval.mate > 0 : a.eval.mate < 0) &&
        !(d.eval.mate !== null && (m.colore === 'w' ? d.eval.mate > 0 : d.eval.mate < 0)),
      materialeMancato:
        a.migliore && a.migliore !== m.uci
          ? materialeDopo(m.fenPrima, a.pv, 3, m.colore) - materialeDopo(m.fenPrima, [m.uci, ...d.pv], 3, m.colore)
          : 0,
    });
    acc[m.colore].push(esito.accuratezza);
    conteggi[m.colore][esito.classificazione]++;
    mosse.push({
      ...m,
      evalPrima: a.eval,
      secondaPrima: a.seconda ?? null,
      evalDopo: d.eval,
      migliore: a.migliore,
      migliorSan: a.migliore ? uciToSan(m.fenPrima, [a.migliore], 1)[0] ?? null : null,
      pvMigliore: uciToSan(m.fenPrima, a.pv),
      ...esito,
    });
  });

  return {
    versione: 2,
    mosse,
    accuratezza: { w: accuratezzaPartita(acc.w), b: accuratezzaPartita(acc.b) },
    conteggi,
  };
}
