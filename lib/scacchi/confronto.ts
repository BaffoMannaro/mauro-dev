// "Tu contro i giocatori del tuo Elo": stesse metriche della Game Review, calcolate per Mauro e per i suoi avversari
// (stesso motore, stessa formula, stessa cadenza). Avversari solo se la differenza di Elo è al massimo MAX_DIFF.
// Funzioni pure: niente DB.
import { faseDi, type Fase } from './fasi';
import type { Review } from './partita';

export const MAX_DIFF = 150;

export type Metriche = {
  partite: number;
  mosse: number;
  accuratezza: number | null;
  imprecisioni100: number;
  errori100: number;
  gravi100: number;
  mancate100: number;
  brillanti10: number;
  ottime10: number;
  /** Errori, errori gravi e mancate ogni 100 mosse giocate in quella fase. */
  fase100: Record<Fase, number | null>;
};

export type Confronto = {
  cadenza: string;
  /** Fascia del rating di Mauro, es. "800-899", oppure "tutte". */
  fascia: string;
  io: Metriche;
  avversari: Metriche;
};

export type RigaConfronto = {
  colore_mio: 'w' | 'b';
  cadenza: string | null;
  elo_bianco: number | null;
  elo_nero: number | null;
  review: Review | null;
};

type Accumulo = { partite: number; mosse: number; acc: number[]; c: Record<string, number>; fase: Record<Fase, { mosse: number; err: number }> };

const nuovo = (): Accumulo => ({
  partite: 0,
  mosse: 0,
  acc: [],
  c: {},
  fase: { apertura: { mosse: 0, err: 0 }, mediogioco: { mosse: 0, err: 0 }, finale: { mosse: 0, err: 0 } },
});

function aggiungi(a: Accumulo, review: Review, colore: 'w' | 'b') {
  a.partite++;
  const v = review.accuratezza[colore];
  if (v !== null && v !== undefined) a.acc.push(v);
  for (const m of review.mosse) {
    if (m.colore !== colore) continue;
    a.mosse++;
    a.c[m.classificazione] = (a.c[m.classificazione] ?? 0) + 1;
    const f = a.fase[faseDi(m.ply, m.fenPrima)];
    f.mosse++;
    if (m.classificazione === 'errore' || m.classificazione === 'grave' || m.classificazione === 'mancata') f.err++;
  }
}

const tondo = (x: number) => Math.round(x * 10) / 10;

function metriche(a: Accumulo): Metriche {
  const per100 = (k: string) => (a.mosse ? tondo(((a.c[k] ?? 0) / a.mosse) * 100) : 0);
  const per10 = (k: string) => (a.partite ? tondo(((a.c[k] ?? 0) / a.partite) * 10) : 0);
  const fase = (f: Fase) => (a.fase[f].mosse >= 20 ? tondo((a.fase[f].err / a.fase[f].mosse) * 100) : null);
  return {
    partite: a.partite,
    mosse: a.mosse,
    accuratezza: a.acc.length ? tondo(a.acc.reduce((x, y) => x + y, 0) / a.acc.length) : null,
    imprecisioni100: per100('imprecisione'),
    errori100: per100('errore'),
    gravi100: per100('grave'),
    mancate100: per100('mancata'),
    brillanti10: per10('brillante'),
    ottime10: per10('ottima'),
    fase100: { apertura: fase('apertura'), mediogioco: fase('mediogioco'), finale: fase('finale') },
  };
}

export function fasciaDi(elo: number) {
  const b = Math.floor(elo / 100) * 100;
  return `${b}-${b + 99}`;
}

/** Confronti per cadenza: uno per fascia di rating di Mauro e uno complessivo ("tutte"). */
export function calcolaConfronto(righe: RigaConfronto[]): Confronto[] {
  const gruppi = new Map<string, { io: Accumulo; avv: Accumulo }>();
  const prendi = (k: string) => {
    let g = gruppi.get(k);
    if (!g) gruppi.set(k, (g = { io: nuovo(), avv: nuovo() }));
    return g;
  };
  for (const r of righe) {
    if (!r.review || !r.cadenza || r.cadenza === 'bot') continue;
    const mio = r.colore_mio === 'w' ? r.elo_bianco : r.elo_nero;
    const suo = r.colore_mio === 'w' ? r.elo_nero : r.elo_bianco;
    if (!mio || !suo || Math.abs(mio - suo) > MAX_DIFF) continue;
    const avv = r.colore_mio === 'w' ? 'b' : 'w';
    for (const k of [`${r.cadenza}|${fasciaDi(mio)}`, `${r.cadenza}|tutte`]) {
      const g = prendi(k);
      aggiungi(g.io, r.review, r.colore_mio);
      aggiungi(g.avv, r.review, avv);
    }
  }
  return [...gruppi.entries()]
    .map(([k, g]) => {
      const [cadenza, fascia] = k.split('|');
      return { cadenza, fascia, io: metriche(g.io), avversari: metriche(g.avv) };
    })
    .sort((a, b) => a.cadenza.localeCompare(b.cadenza) || (a.fascia === 'tutte' ? -1 : b.fascia === 'tutte' ? 1 : b.fascia.localeCompare(a.fascia)));
}

export type Giudizio = 'meglio' | 'in linea' | 'peggio';

/** Confronta un valore con quello degli avversari. `alto` = più alto è meglio. Margine: 1,5 punti per l'accuratezza, 15% per i conteggi. */
export function giudica(io: number | null, avv: number | null, alto: boolean, accuratezza = false): Giudizio | null {
  if (io === null || avv === null) return null;
  const diff = io - avv;
  const soglia = accuratezza ? 1.5 : Math.max(0.3, Math.abs(avv) * 0.15);
  if (Math.abs(diff) < soglia) return 'in linea';
  return diff > 0 === alto ? 'meglio' : 'peggio';
}
