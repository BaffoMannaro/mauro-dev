import sql from '@/lib/db';
import { ensureScacchiSchema } from './db';
import type { Review } from './partita';
import { probPer } from './classifica';
import { calcolaConfronto, type Confronto } from './confronto';

// Statistiche del gioco di Mauro: risultati, aperture, rating, come perde ed errori per fase (dalle partite analizzate).

export type Esiti = { n: number; v: number; p: number; x: number };
const vuoto = (): Esiti => ({ n: 0, v: 0, p: 0, x: 0 });
function somma(e: Esiti, esito: string | null) {
  e.n++;
  if (esito === 'vinta') e.v++;
  else if (esito === 'persa') e.p++;
  else if (esito === 'patta') e.x++;
}

export { faseDi, type Fase } from './fasi';
import { faseDi, type Fase } from './fasi';

/** Come è finita la partita, dal tag Termination di chess.com. */
export function finale(pgn: string): string {
  const t = (/\[Termination "([^"]*)"\]/.exec(pgn)?.[1] ?? '').toLowerCase();
  if (t.includes('checkmate')) return 'matto';
  if (t.includes('resignation')) return 'abbandono';
  if (t.includes('on time')) return 'tempo';
  if (t.includes('abandoned')) return 'abbandonata';
  if (t.includes('agreement')) return 'accordo';
  if (t.includes('repetition')) return 'ripetizione';
  if (t.includes('stalemate')) return 'stallo';
  if (t.includes('insufficient')) return 'materiale insufficiente';
  if (t.includes('50')) return '50 mosse';
  return 'altro';
}

type Riga = {
  id: number;
  pgn: string;
  colore_mio: 'w' | 'b';
  esito_mio: string | null;
  cadenza: string | null;
  apertura: string | null;
  eco: string | null;
  elo_bianco: number | null;
  elo_nero: number | null;
  giocata_il: string | null;
  review: Review | null;
};

export type Statistiche = {
  /** Tu contro gli avversari del tuo Elo (partite analizzate, differenza di Elo ≤ 150). */
  confronto: Confronto[];
  totale: Esiti;
  analizzate: number;
  perColore: { w: Esiti; b: Esiti };
  perCadenza: Record<string, Esiti>;
  perAnno: { anno: number; esiti: Esiti; rating: number | null }[];
  ratingMensile: { mese: string; cadenza: string; rating: number }[];
  perFascia: { fascia: string; esiti: Esiti }[];
  aperture: { colore: 'w' | 'b'; famiglia: string; esiti: Esiti }[];
  comePerdo: Record<string, number>;
  comePareggio: Record<string, number>;
  /** Dalle partite analizzate. */
  errori: {
    perFase: Record<Fase, { mosse: number; imprecisioni: number; errori: number; gravi: number }>;
    accuratezzaMedia: number | null;
    mattiMancati: number;
    persePerTempoInVantaggio: number;
    vantaggiButtati: number;
  };
};

const FASCE: [string, number, number][] = [
  ['Mattina (6-12)', 6, 12],
  ['Pomeriggio (12-18)', 12, 18],
  ['Sera (18-24)', 18, 24],
  ['Notte (0-6)', 0, 6],
];

function oraRoma(iso: string) {
  return Number(new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false }).slice(0, 2)) % 24;
}

export function calcolaStatistiche(righe: Riga[]): Statistiche {
  const s: Statistiche = {
    confronto: calcolaConfronto(righe),
    totale: vuoto(),
    analizzate: 0,
    perColore: { w: vuoto(), b: vuoto() },
    perCadenza: {},
    perAnno: [],
    ratingMensile: [],
    perFascia: FASCE.map(([f]) => ({ fascia: f, esiti: vuoto() })),
    aperture: [],
    comePerdo: {},
    comePareggio: {},
    errori: {
      perFase: {
        apertura: { mosse: 0, imprecisioni: 0, errori: 0, gravi: 0 },
        mediogioco: { mosse: 0, imprecisioni: 0, errori: 0, gravi: 0 },
        finale: { mosse: 0, imprecisioni: 0, errori: 0, gravi: 0 },
      },
      accuratezzaMedia: null,
      mattiMancati: 0,
      persePerTempoInVantaggio: 0,
      vantaggiButtati: 0,
    },
  };
  const anni = new Map<number, { esiti: Esiti; rating: number[] }>();
  const mesi = new Map<string, number[]>();
  const ap = new Map<string, { colore: 'w' | 'b'; famiglia: string; esiti: Esiti }>();
  const acc: number[] = [];

  for (const r of righe) {
    const c = r.colore_mio;
    const mioElo = c === 'w' ? r.elo_bianco : r.elo_nero;
    somma(s.totale, r.esito_mio);
    somma(s.perColore[c], r.esito_mio);
    somma((s.perCadenza[r.cadenza ?? 'altro'] ??= vuoto()), r.esito_mio);
    if (r.giocata_il) {
      const d = new Date(r.giocata_il);
      const a = anni.get(d.getUTCFullYear()) ?? { esiti: vuoto(), rating: [] };
      somma(a.esiti, r.esito_mio);
      if (mioElo && r.cadenza !== 'bot') a.rating.push(mioElo);
      anni.set(d.getUTCFullYear(), a);
      if (mioElo && r.cadenza && r.cadenza !== 'bot') {
        const k = `${r.giocata_il.slice(0, 7)}|${r.cadenza}`;
        mesi.set(k, [...(mesi.get(k) ?? []), mioElo]);
      }
      const h = oraRoma(r.giocata_il);
      const f = FASCE.findIndex(([, da, a2]) => h >= da && h < a2);
      if (f >= 0) somma(s.perFascia[f].esiti, r.esito_mio);
    }
    const famiglia = r.apertura ? r.apertura.split(':')[0] : 'Fuori catalogo';
    const k = `${c}|${famiglia}`;
    const x = ap.get(k) ?? { colore: c, famiglia, esiti: vuoto() };
    somma(x.esiti, r.esito_mio);
    ap.set(k, x);
    const fine = finale(r.pgn);
    if (r.esito_mio === 'persa') s.comePerdo[fine] = (s.comePerdo[fine] ?? 0) + 1;
    if (r.esito_mio === 'patta') s.comePareggio[fine] = (s.comePareggio[fine] ?? 0) + 1;

    const rev = r.review;
    if (!rev) continue;
    s.analizzate++;
    if (rev.accuratezza[c] !== null) acc.push(rev.accuratezza[c]!);
    let massimo = 0;
    for (const m of rev.mosse) {
      if (m.colore !== c) continue;
      const fase = faseDi(m.ply, m.fenPrima);
      const pf = s.errori.perFase[fase];
      pf.mosse++;
      if (m.classificazione === 'imprecisione') pf.imprecisioni++;
      if (m.classificazione === 'errore') pf.errori++;
      if (m.classificazione === 'grave') pf.gravi++;
      // Matto mancato: avevo un matto forzato e non l'ho giocato (e dopo non c'è più).
      if (m.evalPrima.mate !== null && (c === 'w' ? m.evalPrima.mate > 0 : m.evalPrima.mate < 0) && m.uci !== m.migliore) {
        const ancora = m.evalDopo.mate !== null && (c === 'w' ? m.evalDopo.mate > 0 : m.evalDopo.mate < 0);
        if (!ancora && !(m.evalDopo.cp !== null && Math.abs(m.evalDopo.cp) >= 100000)) s.errori.mattiMancati++;
      }
      massimo = Math.max(massimo, probPer(c, m.evalPrima));
    }
    const ultima = rev.mosse[rev.mosse.length - 1];
    const finaleProb = ultima ? probPer(c, ultima.evalDopo) : 0.5;
    if (r.esito_mio === 'persa' && fine === 'tempo' && finaleProb >= 0.6) s.errori.persePerTempoInVantaggio++;
    // Vantaggio buttato: a un certo punto ero all'85% di vittoria e non ho vinto.
    if (massimo >= 0.85 && r.esito_mio !== 'vinta') s.errori.vantaggiButtati++;
  }

  s.perAnno = [...anni.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([anno, a]) => ({ anno, esiti: a.esiti, rating: a.rating.length ? Math.round(a.rating.reduce((x, y) => x + y, 0) / a.rating.length) : null }));
  s.ratingMensile = [...mesi.entries()]
    .map(([k, v]) => {
      const [mese, cadenza] = k.split('|');
      return { mese, cadenza, rating: Math.round(v.reduce((x, y) => x + y, 0) / v.length) };
    })
    .sort((a, b) => a.mese.localeCompare(b.mese));
  s.aperture = [...ap.values()].sort((a, b) => b.esiti.n - a.esiti.n);
  s.errori.accuratezzaMedia = acc.length ? Math.round((acc.reduce((x, y) => x + y, 0) / acc.length) * 10) / 10 : null;
  return s;
}

export async function statistiche(): Promise<Statistiche> {
  await ensureScacchiSchema();
  const righe = (await sql`
    SELECT id, pgn, colore_mio, esito_mio, cadenza, apertura, eco, elo_bianco, elo_nero, giocata_il, review
    FROM scacchi_partite WHERE colore_mio IS NOT NULL
  `) as Riga[];
  return calcolaStatistiche(righe.map((r) => ({ ...r, giocata_il: r.giocata_il ? new Date(r.giocata_il).toISOString() : null })));
}

/** Percentuale intera, null se n = 0. */
export const pct = (x: number, n: number) => (n ? Math.round((x / n) * 100) : null);

