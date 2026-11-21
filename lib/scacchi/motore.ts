'use client';
// Wrapper UCI su Stockfish (WASM, lite single-thread) in un Web Worker.
// Le valutazioni sono restituite dal punto di vista del Bianco.
import { Chess } from 'chess.js';
import type { Valutazione } from './classifica';
import type { AnalisiPosizione } from './partita';

const PERCORSO = '/scacchi/engine/stockfish-19-lite-single.js';

type Linea = { multipv: number; depth: number; eval: Valutazione; pv: string[] };

function alBianco(fen: string, v: Valutazione): Valutazione {
  const nero = fen.split(' ')[1] === 'b';
  if (v.mate !== null) {
    if (v.mate === 0) return { cp: nero ? 100000 : -100000, mate: null }; // chi muove è matto
    return { cp: null, mate: nero ? -v.mate : v.mate };
  }
  return { cp: nero ? -(v.cp ?? 0) : v.cp, mate: null };
}

function leggiInfo(riga: string): Linea | null {
  if (!riga.startsWith('info') || !riga.includes(' pv ') || !riga.includes(' score ')) return null;
  const t = riga.split(' ');
  const get = (k: string) => {
    const i = t.indexOf(k);
    return i >= 0 ? t[i + 1] : undefined;
  };
  const tipo = get('score');
  const i = t.indexOf('score');
  const val = Number(t[i + 2]);
  const pvI = t.indexOf('pv');
  return {
    multipv: Number(get('multipv') ?? 1),
    depth: Number(get('depth') ?? 0),
    eval: tipo === 'mate' ? { cp: null, mate: val } : { cp: val, mate: null },
    pv: t.slice(pvI + 1),
  };
}

export class Motore {
  private w: Worker;
  private coda: Promise<unknown> = Promise.resolve();
  private ascoltatori = new Set<(r: string) => void>();
  private pronto: Promise<void>;

  constructor() {
    this.w = new Worker(PERCORSO);
    this.w.onmessage = (e) => {
      const r = String(e.data);
      for (const f of this.ascoltatori) f(r);
    };
    this.pronto = this.attendi('uci', (r) => r === 'uciok').then(() => undefined);
  }

  private invia(c: string) {
    this.w.postMessage(c);
  }

  private attendi(cmd: string, fine: (r: string) => boolean, onRiga?: (r: string) => void): Promise<string> {
    return new Promise((ok) => {
      const f = (r: string) => {
        onRiga?.(r);
        if (fine(r)) {
          this.ascoltatori.delete(f);
          ok(r);
        }
      };
      this.ascoltatori.add(f);
      this.invia(cmd);
    });
  }

  /** Esegue un lavoro alla volta, in ordine. */
  private inCoda<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.coda.then(fn, fn);
    this.coda = p.catch(() => undefined);
    return p;
  }

  private async opzioni(o: Record<string, string | number | boolean>) {
    await this.pronto;
    for (const [k, v] of Object.entries(o)) this.invia(`setoption name ${k} value ${v}`);
    await this.attendi('isready', (r) => r === 'readyok');
  }

  /** Analisi di una posizione (miglior linea + seconda linea). */
  analizza(fen: string, profondita = 14, onAggiorna?: (a: AnalisiPosizione) => void): Promise<AnalisiPosizione> {
    const fine = new Chess(fen);
    if (fine.isGameOver()) {
      // Matto: chi deve muovere ha perso. Stallo o patta: 0.
      const cp = fine.isCheckmate() ? (fine.turn() === 'w' ? -100000 : 100000) : 0;
      return Promise.resolve({ fen, eval: { cp, mate: null }, migliore: null, pv: [], seconda: null, profondita: 0 });
    }
    return this.inCoda(async () => {
      await this.opzioni({ UCI_LimitStrength: false, 'Skill Level': 20, MultiPV: 2 });
      const linee: Record<number, Linea> = {};
      const crea = (): AnalisiPosizione => {
        const l1 = linee[1];
        const l2 = linee[2];
        return {
          fen,
          eval: l1 ? alBianco(fen, l1.eval) : { cp: 0, mate: null },
          migliore: l1?.pv[0] ?? null,
          pv: l1?.pv ?? [],
          seconda: l2 ? alBianco(fen, l2.eval) : null,
          profondita: l1?.depth ?? 0,
        };
      };
      this.invia(`position fen ${fen}`);
      const best = await this.attendi(`go depth ${profondita}`, (r) => r.startsWith('bestmove'), (r) => {
        const l = leggiInfo(r);
        if (l) {
          linee[l.multipv] = l;
          if (l.multipv === 1) onAggiorna?.(crea());
        }
      });
      const a = crea();
      if (best.includes('(none)')) a.migliore = null;
      return a;
    });
  }

  /** Mossa del bot a un livello Elo. Restituisce la mossa in UCI. */
  mossaBot(fen: string, elo: number): Promise<string | null> {
    const liv = livelloBot(elo);
    return this.inCoda(async () => {
      if (liv.elo) {
        await this.opzioni({ MultiPV: 1, 'Skill Level': 20, UCI_LimitStrength: true, UCI_Elo: liv.elo });
      } else {
        await this.opzioni({ MultiPV: liv.multipv, UCI_LimitStrength: false, 'Skill Level': liv.skill });
      }
      this.invia(`position fen ${fen}`);
      const candidati: string[] = [];
      const best = await this.attendi(
        liv.elo ? `go movetime ${liv.movetime}` : `go depth ${liv.depth}`,
        (r) => r.startsWith('bestmove'),
        (r) => {
          const l = leggiInfo(r);
          if (l && l.pv[0]) candidati[l.multipv - 1] = l.pv[0];
        }
      );
      const m = best.split(' ')[1];
      if (!m || m === '(none)') return null;
      // Ai livelli bassi a volte sceglie una delle alternative: errori "umani".
      if (!liv.elo && Math.random() < liv.casuale && candidati.length > 1) {
        const alt = candidati.filter(Boolean);
        return alt[Math.floor(Math.random() * alt.length)];
      }
      return m;
    });
  }

  stop() {
    this.invia('stop');
  }

  chiudi() {
    this.w.terminate();
  }
}

export type LivelloBot = {
  elo?: number;
  skill: number;
  depth: number;
  multipv: number;
  casuale: number;
  movetime: number;
};

/** Sotto 1320 Stockfish non limita l'Elo: uso Skill Level, profondità bassa e scelte casuali tra le alternative. */
export function livelloBot(elo: number): LivelloBot {
  if (elo >= 1320) return { elo: Math.min(3190, elo), skill: 20, depth: 0, multipv: 1, casuale: 0, movetime: 600 };
  if (elo < 500) return { skill: 0, depth: 1, multipv: 6, casuale: 0.45, movetime: 0 };
  if (elo < 700) return { skill: 0, depth: 1, multipv: 4, casuale: 0.3, movetime: 0 };
  if (elo < 900) return { skill: 2, depth: 2, multipv: 3, casuale: 0.2, movetime: 0 };
  if (elo < 1100) return { skill: 4, depth: 3, multipv: 3, casuale: 0.12, movetime: 0 };
  return { skill: 6, depth: 5, multipv: 2, casuale: 0.06, movetime: 0 };
}

export const BOT = [
  { elo: 400, nome: 'Principiante' },
  { elo: 600, nome: 'Novizio' },
  { elo: 800, nome: 'Dilettante' },
  { elo: 1000, nome: 'Circolo' },
  { elo: 1200, nome: 'Agonista' },
  { elo: 1400, nome: 'Esperto' },
  { elo: 1600, nome: 'Avanzato' },
  { elo: 1800, nome: 'Candidato Maestro' },
  { elo: 2000, nome: 'Maestro' },
  { elo: 2200, nome: 'Maestro FIDE' },
  { elo: 2500, nome: 'Grande Maestro' },
  { elo: 3000, nome: 'Motore' },
];
