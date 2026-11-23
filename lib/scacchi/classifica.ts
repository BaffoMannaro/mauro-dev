// Classificazione delle mosse stile Game Review, a partire dalle valutazioni del motore.
// Tutte le valutazioni sono dal punto di vista del Bianco (centipedoni o matto in N).
// Funzioni pure: nessun DB, nessun motore, testabili.

export type Valutazione = { cp: number | null; mate: number | null };

export type Classificazione =
  | 'libro'
  | 'brillante'
  | 'ottima'
  | 'migliore'
  | 'eccellente'
  | 'buona'
  | 'imprecisione'
  | 'errore'
  | 'grave'
  /** Occasione mancata: c'era un matto o un guadagno netto di materiale e non l'hai giocato. */
  | 'mancata';

export const ETICHETTE: Record<Classificazione, string> = {
  libro: 'Libro',
  brillante: 'Brillante',
  ottima: 'Ottima',
  migliore: 'Migliore',
  eccellente: 'Eccellente',
  buona: 'Buona',
  imprecisione: 'Imprecisione',
  errore: 'Errore',
  grave: 'Errore grave',
  mancata: 'Mancata',
};

export const SIMBOLI: Record<Classificazione, string> = {
  libro: '',
  brillante: '!!',
  ottima: '!',
  migliore: '★',
  eccellente: '',
  buona: '',
  imprecisione: '?!',
  errore: '?',
  grave: '??',
  mancata: '✕',
};

export const COLORI: Record<Classificazione, string> = {
  libro: '#a88865',
  brillante: '#26c2a3',
  ottima: '#5c8bb0',
  migliore: '#81b64c',
  eccellente: '#81b64c',
  buona: '#95b776',
  imprecisione: '#f7c631',
  errore: '#ffa459',
  grave: '#fa412d',
  mancata: '#ee6b55',
};

/** Centipedoni equivalenti: il matto vale come una valutazione enorme, più vicino = più grande. */
export function cpEquivalente(v: Valutazione): number {
  if (v.mate !== null && v.mate !== undefined) {
    if (v.mate === 0) return 0;
    const segno = v.mate > 0 ? 1 : -1;
    return segno * (10000 - Math.abs(v.mate) * 10);
  }
  return v.cp ?? 0;
}

/** Probabilità di vittoria (0..1) per il Bianco, formula Lichess. */
export function probVittoria(v: Valutazione): number {
  if (v.mate !== null && v.mate !== undefined) {
    if (v.mate === 0) return 0.5; // non dovrebbe capitare: il matto dato si gestisce a parte
    return v.mate > 0 ? 1 : 0;
  }
  const cp = Math.max(-1000, Math.min(1000, v.cp ?? 0));
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}

/** Probabilità di vittoria dal punto di vista di chi muove. */
export function probPer(colore: 'w' | 'b', v: Valutazione): number {
  const p = probVittoria(v);
  return colore === 'w' ? p : 1 - p;
}

/** Accuratezza di una singola mossa (0..100) dalla perdita di probabilità, formula Lichess. */
export function accuratezzaMossa(primaPct: number, dopoPct: number): number {
  const perdita = Math.max(0, primaPct - dopoPct);
  const a = 103.1668 * Math.exp(-0.04354 * perdita) - 3.1669;
  return Math.max(0, Math.min(100, a));
}

/** Accuratezza di partita: media tra media aritmetica e armonica (penalizza gli errori gravi). */
export function accuratezzaPartita(mosse: number[]): number | null {
  if (mosse.length === 0) return null;
  const arit = mosse.reduce((s, x) => s + x, 0) / mosse.length;
  const arm = mosse.length / mosse.reduce((s, x) => s + 1 / Math.max(x, 1), 0);
  return Math.round(((arit + arm) / 2) * 10) / 10;
}

export type InputMossa = {
  colore: 'w' | 'b';
  /** Mossa giocata in UCI (e2e4). */
  giocata: string;
  /** Valutazione della posizione PRIMA della mossa (miglior linea). */
  prima: Valutazione;
  /** Seconda miglior linea della posizione prima (multipv 2), se disponibile. */
  secondaPrima?: Valutazione | null;
  /** Mossa migliore del motore nella posizione prima. */
  migliore: string | null;
  /** Valutazione della posizione DOPO la mossa. */
  dopo: Valutazione;
  /** La posizione dopo la mossa è nel catalogo aperture. */
  libro?: boolean;
  /** Materiale sacrificato (in punti pedone) da chi muove, verificato sulla linea del motore. */
  sacrificio?: number;
  /** Matto dato con questa mossa. */
  matto?: boolean;
  /** Chi muove aveva un matto forzato e dopo la mossa non ce l'ha più. */
  mattoPerso?: boolean;
  /** Punti di materiale che la linea migliore guadagnava in più rispetto alla mossa giocata. */
  materialeMancato?: number;
};

export type EsitoMossa = {
  classificazione: Classificazione;
  /** Probabilità persa (0..1) per chi muove. */
  perdita: number;
  accuratezza: number;
};

export function classificaMossa(m: InputMossa): EsitoMossa {
  const prima = probPer(m.colore, m.prima);
  const dopo = m.matto ? 1 : probPer(m.colore, m.dopo);
  const perdita = Math.max(0, prima - dopo);
  const accuratezza = Math.round(accuratezzaMossa(prima * 100, dopo * 100) * 10) / 10;

  if (m.libro) return { classificazione: 'libro', perdita, accuratezza: 100 };

  const eMigliore = m.matto || (m.migliore !== null && m.giocata === m.migliore);

  // Brillante: sacrificio vero di materiale, mossa migliore o quasi, posizione non già vinta e ancora buona dopo.
  if (
    (m.sacrificio ?? 0) >= 2 &&
    perdita <= 0.02 &&
    prima < 0.97 &&
    dopo >= 0.5
  ) {
    return { classificazione: 'brillante', perdita, accuratezza };
  }

  // Ottima: unica mossa buona (la seconda linea perdeva molto).
  if (eMigliore && m.secondaPrima) {
    const seconda = probPer(m.colore, m.secondaPrima);
    if (prima - seconda >= 0.15 && dopo >= 0.35 && prima < 0.97) {
      return { classificazione: 'ottima', perdita, accuratezza };
    }
  }

  // Posizioni già decise: la probabilità non si muove, ma un matto o un pezzo lasciati per strada contano.
  if (!eMigliore && perdita <= 0.1 && (m.mattoPerso || (m.materialeMancato ?? 0) >= 3)) {
    return { classificazione: 'mancata', perdita, accuratezza };
  }

  if (eMigliore || perdita < 0.005) return { classificazione: 'migliore', perdita, accuratezza };
  if (perdita <= 0.02) return { classificazione: 'eccellente', perdita, accuratezza };
  if (perdita <= 0.05) return { classificazione: 'buona', perdita, accuratezza };
  if (perdita <= 0.1) return { classificazione: 'imprecisione', perdita, accuratezza };
  if (perdita <= 0.2) return { classificazione: 'errore', perdita, accuratezza };
  return { classificazione: 'grave', perdita, accuratezza };
}

export const VALORI_PEZZI: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Materiale del colore indicato meno quello avversario, da una FEN. */
export function bilancioMateriale(fen: string, colore: 'w' | 'b'): number {
  const pos = fen.split(' ')[0];
  let s = 0;
  for (const ch of pos) {
    const v = VALORI_PEZZI[ch.toLowerCase()];
    if (v === undefined) continue;
    const bianco = ch === ch.toUpperCase();
    s += (bianco === (colore === 'w') ? 1 : -1) * v;
  }
  return s;
}

/** Testo leggibile della valutazione per il Bianco: +1.2, -0.4, M3, -M2. */
export function formattaValutazione(v: Valutazione): string {
  if (v.mate !== null && v.mate !== undefined) return v.mate > 0 ? `M${v.mate}` : `-M${Math.abs(v.mate)}`;
  const x = (v.cp ?? 0) / 100;
  return (x > 0 ? '+' : '') + x.toFixed(1);
}
