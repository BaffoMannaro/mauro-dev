// Che tipo di errore è? Dalla Game Review (linee del motore già salvate) senza rianalizzare.
// Funzioni pure: testabili senza DB e senza motore.
import { Chess } from 'chess.js';
import { bilancioMateriale, probPer } from './classifica';
import { faseDi, type Fase } from './fasi';
import type { MossaReview, Review } from './partita';

export type TipoErrore = 'regalo' | 're' | 'occasione' | 'finale' | 'zeitnot' | 'posizionale';

export const NOMI_TIPO: Record<TipoErrore, string> = {
  regalo: 'Pezzo o pedone lasciato in presa',
  re: 'Re in pericolo (minaccia di matto o attacco)',
  occasione: 'Occasione mancata',
  finale: 'Errore nel finale',
  zeitnot: 'Mossa in zeitnot',
  posizionale: 'Errore posizionale',
};

export const CONSIGLI_TIPO: Record<TipoErrore, string> = {
  regalo: 'Dopo aver scelto la mossa, guarda ogni tuo pezzo: è difeso? Quante volte è attaccato?',
  re: 'Prima di muovere un pedone davanti al Re o di cambiare un difensore, chiediti quali linee apri verso il tuo Re.',
  occasione: 'Quando l\'avversario muove, cerca prima scacchi, catture e minacce tue: spesso ha appena lasciato qualcosa.',
  finale: 'Nei finali spingi i pedoni passati, attiva il Re e contro un Re solo conta sempre le sue case libere.',
  zeitnot: 'Gioca più veloce nelle mosse semplici (aperture note, riprese obbligate) per avere tempo nei momenti critici.',
  posizionale: 'Prima di una mossa lenta chiediti qual è il piano: quale pezzo migliora e cosa cambia nella struttura.',
};

export type ErroreAnalizzato = {
  ply: number;
  san: string;
  classificazione: string;
  migliore: string | null;
  fase: Fase;
  tipi: TipoErrore[];
  /** Secondi rimasti dopo la mossa, se noti. */
  clk: number | null;
};

function sanSeq(fen: string, san: string[], n: number) {
  const c = new Chess(fen);
  let scacchi = 0;
  let matto = false;
  for (const s of san.slice(0, n)) {
    try {
      const m = c.move(s);
      if (m.san.includes('+')) scacchi++;
      if (m.san.includes('#')) matto = true;
    } catch {
      break;
    }
  }
  return { fen: c.fen(), scacchi, matto };
}

/** Tipi di un singolo errore di chi ha mosso `m`; `risposta` è la mossa successiva dell'avversario (con la sua linea migliore). */
export function tipiDi(m: MossaReview, risposta: MossaReview | undefined, tempoBase: number | null): TipoErrore[] {
  const tipi: TipoErrore[] = [];
  const io = m.colore;
  // Linea migliore dell'avversario dalla posizione dopo la mia mossa.
  if (risposta && risposta.pvMigliore.length) {
    const prima = bilancioMateriale(m.fenDopo, io);
    const dopo = sanSeq(m.fenDopo, risposta.pvMigliore, 3);
    if (prima - bilancioMateriale(dopo.fen, io) >= 2) tipi.push('regalo');
    const mattoContro = risposta.evalPrima.mate !== null && (io === 'w' ? risposta.evalPrima.mate < 0 : risposta.evalPrima.mate > 0);
    if (mattoContro || dopo.matto || dopo.scacchi >= 2) tipi.push('re');
  }
  // La mia linea migliore guadagnava materiale o dava matto?
  if (m.classificazione === 'mancata') tipi.push('occasione');
  else if (m.pvMigliore.length && m.migliore !== m.uci) {
    const mia = sanSeq(m.fenPrima, m.pvMigliore, 3);
    const mattoMio = m.evalPrima.mate !== null && (io === 'w' ? m.evalPrima.mate > 0 : m.evalPrima.mate < 0);
    if (mattoMio || bilancioMateriale(mia.fen, io) - bilancioMateriale(m.fenPrima, io) >= 2) tipi.push('occasione');
  }
  if (faseDi(m.ply, m.fenPrima) === 'finale') tipi.push('finale');
  if (tempoBase && m.clk !== null && m.clk !== undefined && m.clk < tempoBase * 0.15) tipi.push('zeitnot');
  if (tipi.length === 0) tipi.push('posizionale');
  return tipi;
}

/** Errori (errore, grave, mancata) di un colore in una partita, con il loro tipo. */
export function erroriDellaPartita(review: Review, colore: 'w' | 'b', tempoBase: number | null): ErroreAnalizzato[] {
  const out: ErroreAnalizzato[] = [];
  review.mosse.forEach((m, i) => {
    if (m.colore !== colore || !['errore', 'grave', 'mancata'].includes(m.classificazione)) return;
    out.push({
      ply: m.ply,
      san: m.san,
      classificazione: m.classificazione,
      migliore: m.migliorSan,
      fase: faseDi(m.ply, m.fenPrima),
      tipi: tipiDi(m, review.mosse[i + 1], tempoBase),
      clk: m.clk ?? null,
    });
  });
  return out;
}

/** Massima probabilità di vittoria raggiunta da `colore` (per le vittorie non convertite). */
export function massimoVantaggio(review: Review, colore: 'w' | 'b'): number {
  return review.mosse.reduce((x, m) => Math.max(x, probPer(colore, m.evalDopo)), 0);
}
