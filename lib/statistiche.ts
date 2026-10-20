// Statistiche per periodo (un anno o il totale): incassato, tasse, abbonamenti, netto e medie.
// Funzioni pure, usate dalla pagina Statistiche.
//
// - Incassato lordo: fatture pagate + tranche spuntate senza fattura (lib/incassi.ts).
// - Tasse e INPS: solo sulle fatture pagate nell'anno (lib/fisco.ts); i pagamenti senza
//   fattura non sono tassati e vengono indicati a parte.
// - Netto = incassato − tasse e INPS − abbonamenti.
// - Anno in corso: medie sui mesi e sui giorni lavorativi già trascorsi.

import { accettato, calcolaIncassi, giorno, type FatturaIncasso, type PreventivoIncasso } from './incassi';
import { calcolaFisco, incassatoAnno, type Fisco, type ImpostazioniFisco } from './fisco';

export interface AbbonamentoStat {
  cifra: number | string;
  cadenza: string;
  data_inizio: string;
  data_fine: string | null;
}

export interface PreventivoStat extends PreventivoIncasso {
  oggetto: string;
  cliente_nome: string;
  lavoro_inizio: string | null;
  lavoro_fine: string | null;
}

export const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

/** Costo di un abbonamento in un mese (mese 0–11). */
export function costoMensileAbbonamento(ab: AbbonamentoStat, anno: number, mese: number): number {
  const inizio = new Date(ab.data_inizio);
  const fine = ab.data_fine ? new Date(ab.data_fine) : null;
  if (inizio > new Date(anno, mese + 1, 0)) return 0;
  if (fine && fine < new Date(anno, mese, 1)) return 0;
  if (ab.cadenza === 'mensile') return Number(ab.cifra);
  if (ab.cadenza === 'annuale') return Number(ab.cifra) / 12;
  if (ab.cadenza === 'una tantum' && inizio.getFullYear() === anno && inizio.getMonth() === mese) return Number(ab.cifra);
  return 0;
}

/** Giorni lavorativi (lun–ven) dal 1° gennaio al 31 dicembre, oppure fino a oggi per l'anno in corso. */
function giorniLavorativi(anno: number, oggi: Date) {
  const fine = anno === oggi.getFullYear() ? oggi : new Date(anno, 11, 31);
  let n = 0;
  for (const d = new Date(anno, 0, 1); d <= fine; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0 && d.getDay() !== 6) n++;
  }
  return n;
}

const annoDi = (d: string | Date | null | undefined) => {
  const g = giorno(d);
  return g ? Number(g.slice(0, 4)) : NaN;
};
const dataAccettazione = (p: PreventivoIncasso) => p.accettato_at || p.created_at;

export interface Barra {
  label: string;
  incassato: number;
  tasse: number;
  abbonamenti: number;
  netto: number;
  futuro: boolean;
}

export interface Periodo {
  periodo: number | 'totale';
  incassato: number;
  senzaFattura: number;
  imposta: number;
  contributi: number;
  tasse: number;
  abbonamenti: number;
  netto: number;
  mesi: number;
  giorni: number;
  mediaNettoMese: number;
  nettoGiorno: number;
  lordoGiorno: number;
  /** Preventivi accettati nel periodo (per data di accettazione). */
  accettati: PreventivoStat[];
  contrattualizzato: number;
  daIncassare: number;
  /** Preventivi creati nel periodo: quanti accettati, rifiutati, in attesa. */
  tassoAccettazione: number | null;
  rifiutati: number;
  inAttesa: number;
  perPreventivo: Map<number, number>;
  /** Mesi dell'anno (gen–dic) o, per il totale, un elemento per anno. */
  barre: Barra[];
  /** Fisco dell'anno (solo per i periodi annuali). */
  fisco: Fisco | null;
}

export interface DatiStatistiche {
  preventivi: PreventivoStat[];
  fatture: FatturaIncasso[];
  abbonamenti: AbbonamentoStat[];
  impostazioni: ImpostazioniFisco;
}

/** Anni con dati (incassi o preventivi accettati), sempre compreso quello in corso, dal più vecchio. */
export function anniDisponibili(d: DatiStatistiche, oggi = new Date()) {
  const { incassi } = calcolaIncassi(d.preventivi, d.fatture);
  const corrente = oggi.getFullYear();
  const anni = new Set<number>([corrente]);
  incassi.forEach((x) => anni.add(annoDi(x.data)));
  d.preventivi.filter(accettato).forEach((p) => anni.add(annoDi(dataAccettazione(p))));
  return [...anni].filter((a) => Number.isFinite(a) && a > 2000 && a <= corrente).sort((a, b) => a - b);
}

export function calcolaPeriodo(periodo: number | 'totale', d: DatiStatistiche, oggi = new Date()): Periodo {
  const { incassi, perPreventivo } = calcolaIncassi(d.preventivi, d.fatture);
  const anni = periodo === 'totale' ? anniDisponibili(d, oggi) : [periodo];
  const corrente = oggi.getFullYear();

  const perAnno = anni.map((anno) => {
    const mesiTrascorsi = anno < corrente ? 12 : anno === corrente ? oggi.getMonth() + 1 : 0;
    const incassiAnno = incassi.filter((x) => annoDi(x.data) === anno);
    const fatturato = incassatoAnno(d.fatture, anno); // base delle tasse
    const fisco = calcolaFisco(anno, fatturato, d.impostazioni, oggi);
    const tasse = fisco.imposta + fisco.contributi;
    const aliquotaEffettiva = fatturato > 0 ? tasse / fatturato : 0;

    const barre: Barra[] = MESI.map((label, m) => {
      const mese = incassiAnno.filter((x) => Number(x.data.slice(5, 7)) - 1 === m);
      const incassato = mese.reduce((s, x) => s + x.importo, 0);
      const tasseMese = mese.filter((x) => x.fonte === 'fattura').reduce((s, x) => s + x.importo, 0) * aliquotaEffettiva;
      const futuro = m >= mesiTrascorsi;
      const abbonamenti = futuro ? 0 : d.abbonamenti.reduce((s, ab) => s + costoMensileAbbonamento(ab, anno, m), 0);
      return { label, incassato, tasse: tasseMese, abbonamenti, netto: incassato - tasseMese - abbonamenti, futuro };
    });

    const incassato = incassiAnno.reduce((s, x) => s + x.importo, 0);
    const abbonamenti = barre.reduce((s, b) => s + b.abbonamenti, 0);
    return {
      anno, fisco, incassato, tasse, abbonamenti, barre,
      senzaFattura: Math.max(0, incassato - fatturato),
      netto: incassato - tasse - abbonamenti,
      mesi: mesiTrascorsi,
      giorni: giorniLavorativi(anno, oggi),
    };
  });

  const somma = (k: 'incassato' | 'tasse' | 'abbonamenti' | 'netto' | 'senzaFattura' | 'mesi' | 'giorni') =>
    perAnno.reduce((s, a) => s + a[k], 0);
  const incassato = somma('incassato');
  const netto = somma('netto');
  const mesi = somma('mesi');
  const giorni = somma('giorni');

  // Preventivi del periodo.
  const nelPeriodo = (d: string | Date | null) => anni.includes(annoDi(d));
  const accettati = d.preventivi.filter((p) => accettato(p) && nelPeriodo(dataAccettazione(p)));
  const creati = d.preventivi.filter((p) => nelPeriodo(p.created_at));

  return {
    periodo,
    incassato,
    senzaFattura: somma('senzaFattura'),
    imposta: perAnno.reduce((s, a) => s + a.fisco.imposta, 0),
    contributi: perAnno.reduce((s, a) => s + a.fisco.contributi, 0),
    tasse: somma('tasse'),
    abbonamenti: somma('abbonamenti'),
    netto,
    mesi,
    giorni,
    mediaNettoMese: mesi > 0 ? netto / mesi : 0,
    nettoGiorno: giorni > 0 ? netto / giorni : 0,
    lordoGiorno: giorni > 0 ? incassato / giorni : 0,
    accettati,
    contrattualizzato: accettati.reduce((s, p) => s + Number(p.totale), 0),
    daIncassare: accettati.reduce((s, p) => s + Math.max(0, Number(p.totale) - (perPreventivo.get(p.id) ?? 0)), 0),
    tassoAccettazione: creati.length ? Math.round((creati.filter(accettato).length / creati.length) * 100) : null,
    rifiutati: creati.filter((p) => p.stato === 'rifiutato').length,
    inAttesa: creati.filter((p) => p.stato === 'inviato').length,
    perPreventivo,
    barre: periodo === 'totale'
      ? perAnno.map((a) => ({ label: String(a.anno), incassato: a.incassato, tasse: a.tasse, abbonamenti: a.abbonamenti, netto: a.netto, futuro: false }))
      : perAnno[0].barre,
    fisco: periodo === 'totale' ? null : perAnno[0].fisco,
  };
}
