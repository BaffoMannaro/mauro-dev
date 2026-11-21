// Logica del coach: aderenza di una partita al repertorio e programma delle missioni.
import { Chess } from 'chess.js';
import { REPERTORIO, type Linea } from './repertorio';
import { epd } from './partita';

export type Mappa = Map<string, string>; // EPD della posizione -> mossa SAN del repertorio

/** Posizione -> mossa attesa da Mauro, per le linee indicate (tutte se vuoto). */
export function mappaRepertorio(colore: 'w' | 'b', ids?: string[]): Mappa {
  const m: Mappa = new Map();
  const linee = REPERTORIO.filter((l) => l.colore === colore && (!ids?.length || ids.includes(l.id)));
  for (const l of linee) {
    const c = new Chess();
    l.mosse.forEach(([san], i) => {
      const mia = (i % 2 === 0 ? 'w' : 'b') === colore;
      if (mia && !m.has(epd(c.fen()))) m.set(epd(c.fen()), san);
      c.move(san);
    });
  }
  return m;
}

export type Aderenza = {
  /** true se Mauro non è mai uscito dal repertorio (l'avversario può uscire). */
  inRegola: boolean;
  /** Mosse di Mauro giocate secondo il repertorio. */
  mosseInRepertorio: number;
  deviazione: { ply: number; giocata: string; attesa: string } | null;
  /** Ply in cui finisce il repertorio (l avversario esce o la linea è finita). */
  fineRepertorio: number | null;
};

export function aderenza(pgn: string, colore: 'w' | 'b', ids?: string[]): Aderenza {
  const mappa = mappaRepertorio(colore, ids);
  const c = new Chess();
  c.loadPgn(pgn);
  const storia = c.history({ verbose: true });
  let mosseInRepertorio = 0;
  for (let i = 0; i < storia.length; i++) {
    const m = storia[i];
    const attesa = mappa.get(epd(m.before));
    if (m.color === colore) {
      if (!attesa) return { inRegola: true, mosseInRepertorio, deviazione: null, fineRepertorio: null };
      if (attesa !== m.san) return { inRegola: false, mosseInRepertorio, deviazione: { ply: i + 1, giocata: m.san, attesa }, fineRepertorio: null };
      mosseInRepertorio++;
    } else {
      // Dopo la mossa avversaria: se non c è una mia mossa prevista, il repertorio è finito qui.
      if (!mappa.has(epd(m.after))) return { inRegola: true, mosseInRepertorio, deviazione: null, fineRepertorio: i + 1 };
    }
  }
  return { inRegola: true, mosseInRepertorio, deviazione: null, fineRepertorio: null };
}

/** true se la partita è finita per tempo e Mauro ha perso. */
export function persaPerTempo(pgn: string, colore: 'w' | 'b'): boolean {
  const t = /\[Termination "([^"]*)"\]/.exec(pgn)?.[1]?.toLowerCase() ?? '';
  if (!t.includes('on time') && !t.includes('tempo')) return false;
  const r = /\[Result "([^"]*)"\]/.exec(pgn)?.[1];
  return (colore === 'w' && r === '0-1') || (colore === 'b' && r === '1-0');
}

export type RegoleMissione = {
  /** Linee del repertorio da rispettare (bianco e nero). */
  linee: string[];
  /** Cadenze chess.com valide (rapid, blitz, ...). Vuoto = tutte. */
  cadenze: string[];
  /** Numero di partite della missione. */
  partite: number;
  /** Obiettivi misurabili. */
  minInRegola?: number;
  maxPersePerTempo?: number;
  maxGraviMedi?: number;
  /** Linee da completare nei drill prima di iniziare. */
  drill?: string[];
};

export type MissioneProgramma = { codice: string; titolo: string; descrizione: string; regole: RegoleMissione };

const ITALIANA = ['b-italiana-piano', 'b-italiana-duecavalli', 'n-italiana-piano', 'n-italiana-arrocco', 'n-evans', 'n-alfiere'];
const SCOMODE = ['b-philidor', 'b-scandinava', 'b-carokann', 'n-scozzese', 'n-spagnola'];

export const PROGRAMMA: MissioneProgramma[] = [
  {
    codice: 'm1-italiana',
    titolo: 'Missione 1 · L\'Italiana da entrambi i lati',
    descrizione:
      'Gioca 10 partite a 10 minuti (rapid). Col Bianco: 1.e4 e, dopo 2...Nc6, 3.Bc4. Col Nero contro 1.e4: 1...e5 e contro l\'Italiana 3...Bc5. ' +
      'Prima di iniziare completa i drill delle linee dell\'Italiana. Usa il tempo: a 10 minuti puoi pensare 20-30 secondi a mossa.',
    regole: { linee: ITALIANA, cadenze: ['rapid'], partite: 10, minInRegola: 8, maxPersePerTempo: 0, drill: ITALIANA },
  },
  {
    codice: 'm2-scomode',
    titolo: 'Missione 2 · Le difese scomode',
    descrizione:
      'Altre 10 partite rapid con tutto il repertorio: contro Philidor, Scandinava e Caro-Kann segui le linee studiate; col Nero contro Scozzese e Spagnola idem. ' +
      'Obiettivo: arrivare in un mediogioco che conosci, senza regalare tempi in apertura.',
    regole: { linee: [...ITALIANA, ...SCOMODE], cadenze: ['rapid'], partite: 10, minInRegola: 7, maxPersePerTempo: 1, drill: SCOMODE },
  },
  {
    codice: 'm3-niente-regali',
    titolo: 'Missione 3 · Niente regali',
    descrizione:
      'Prima di ogni mossa chiediti: cosa minaccia l\'avversario? Cosa lascio in presa? 10 partite rapid con tutto il repertorio, ' +
      'obiettivo al massimo 1 errore grave per partita in media (serve la Game Review di ogni partita).',
    regole: { linee: [...ITALIANA, ...SCOMODE], cadenze: ['rapid'], partite: 10, minInRegola: 7, maxPersePerTempo: 1, maxGraviMedi: 1 },
  },
];

export function lineeDi(ids: string[]): Linea[] {
  return REPERTORIO.filter((l) => ids.includes(l.id));
}
