// Netto, tasse e contributi per il regime forfettario con Gestione Separata INPS.
// Funzioni pure: usate da Statistiche, Fatture e dal connettore Claude.
//
// Regole (verificate a ottobre 2026, da ricontrollare ogni anno):
// - reddito = incassato (rivalsa INPS 4% inclusa) × coefficiente di redditività (ATECO 62.10: 67%)
// - contributi Gestione Separata = reddito × 26,07% (fino al massimale)
// - imposta sostitutiva = (reddito − contributi versati nell'anno) × 15% (oltre i primi 5 anni)
// - metodo storico: acconto imposta = 100% dell'imposta dell'anno prima (50% giugno + 50% novembre;
//   sotto 51,65 € niente acconto, fino a 257,52 € tutto a novembre);
//   acconto contributi = 80% dei contributi dell'anno prima (40% giugno + 40% novembre).
// - giugno/luglio: saldo dell'anno prima + 1° acconto; 30 novembre: 2° acconto.

export interface DatiAnnoChiuso {
  /** Imposta sostitutiva dovuta per l'anno (Modello Redditi, quadro LM). */
  imposta: number;
  /** Acconti d'imposta versati per quell'anno. */
  accontiImposta: number;
  /** Contributi Gestione Separata dovuti per l'anno (quadro RR). */
  contributi: number;
  /** Acconti di contributi versati per quell'anno. */
  accontiContributi: number;
}

export interface ImpostazioniFisco {
  coefficiente: number; // 0.67
  aliquotaContributi: number; // 0.2607
  aliquotaImposta: number; // 0.15
  massimale: number; // reddito massimo soggetto a contributi
  /** Dati dalle dichiarazioni degli anni chiusi, per anno ("2025"). */
  anni: Record<string, DatiAnnoChiuso>;
}

export const FISCO_BASE: ImpostazioniFisco = {
  coefficiente: 0.67,
  aliquotaContributi: 0.2607,
  aliquotaImposta: 0.15,
  massimale: 122295,
  anni: {},
};

/** Unisce le impostazioni salvate a quelle di base (campi mancanti o non numerici → base). */
export function leggiImpostazioniFisco(v: unknown): ImpostazioniFisco {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<ImpostazioniFisco>;
  const n = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  return {
    coefficiente: n(o.coefficiente, FISCO_BASE.coefficiente),
    aliquotaContributi: n(o.aliquotaContributi, FISCO_BASE.aliquotaContributi),
    aliquotaImposta: n(o.aliquotaImposta, FISCO_BASE.aliquotaImposta),
    massimale: n(o.massimale, FISCO_BASE.massimale),
    anni: o.anni && typeof o.anni === 'object' ? o.anni : {},
  };
}

export interface FatturaFisco {
  importo: number | string | null;
  stato: string;
  data: string | null; // data fattura YYYY-MM-DD
  pagata_il?: string | null; // giorno dell'incasso
}

/** Giorno dell'incasso: quello registrato, altrimenti la data fattura (fatture segnate pagate prima di ottobre 2026). */
export const giornoIncasso = (f: FatturaFisco) => (f.pagata_il || f.data || '').slice(0, 10);

/** Incassato di un anno: fatture pagate con incasso in quell'anno. */
export const incassatoAnno = (fatture: FatturaFisco[], anno: number) =>
  fatture
    .filter((f) => f.stato === 'pagata' && giornoIncasso(f).startsWith(`${anno}-`))
    .reduce((s, f) => s + (Number(f.importo) || 0), 0);

const cent = (n: number) => Math.round(n * 100) / 100;

/** Acconto d'imposta col metodo storico, diviso tra le due scadenze. */
function accontoImposta(base: number) {
  if (base < 51.65) return { giugno: 0, novembre: 0 };
  if (base <= 257.52) return { giugno: 0, novembre: cent(base) };
  return { giugno: cent(base / 2), novembre: cent(base - cent(base / 2)) };
}
const accontoContributi = (base: number) => ({ giugno: cent(base * 0.4), novembre: cent(base * 0.4) });

export interface Scadenza {
  data: string; // YYYY-MM-DD
  titolo: string;
  imposta: number;
  contributi: number;
  totale: number;
  /** true se l'importo dipende da stime (anno ancora aperto o dati mancanti). */
  stimata: boolean;
}

export interface Fisco {
  anno: number;
  incassato: number;
  reddito: number;
  contributi: number;
  imposta: number;
  netto: number;
  /** Quota del netto sull'incassato (0–1). */
  quotaNetta: number;
  /** Tasse e contributi dell'anno non ancora coperti da acconti già scaduti. */
  daAccantonare: number;
  scadenze: Scadenza[];
  /** Mancano i dati dell'anno prima: acconti e deduzione dei contributi sono stimati. */
  datiMancanti: boolean;
}

/**
 * Tasse e netto dell'anno `anno` sull'incassato (di competenza), con le scadenze di cassa
 * dal giugno di quest'anno al novembre del prossimo.
 */
export function calcolaFisco(anno: number, incassato: number, imp: ImpostazioniFisco, oggi = new Date()): Fisco {
  const prec = imp.anni[String(anno - 1)];
  const reddito = cent(incassato * imp.coefficiente);
  const contributi = cent(Math.min(reddito, imp.massimale) * imp.aliquotaContributi);

  // Acconti di quest'anno, calcolati sull'anno prima.
  const accImp = accontoImposta(prec?.imposta ?? 0);
  const accContr = accontoContributi(prec?.contributi ?? 0);
  const accontiImposta = accImp.giugno + accImp.novembre;
  const accontiContributi = accContr.giugno + accContr.novembre;

  // Contributi versati quest'anno (deducibili): saldo dell'anno prima + acconti di quest'anno.
  // Senza i dati dell'anno prima si usano i contributi di competenza.
  const contributiVersati = prec
    ? Math.max(0, prec.contributi - prec.accontiContributi) + accontiContributi
    : contributi;
  const imposta = cent(Math.max(0, reddito - contributiVersati) * imp.aliquotaImposta);
  const netto = cent(incassato - contributi - imposta);

  const scadenze: Scadenza[] = [];
  const voce = (data: string, titolo: string, i: number, c: number, stimata: boolean) =>
    scadenze.push({ data, titolo, imposta: cent(i), contributi: cent(c), totale: cent(i + c), stimata });

  if (prec) {
    voce(`${anno}-06-30`, `Saldo ${anno - 1} + 1° acconto ${anno}`,
      prec.imposta - prec.accontiImposta + accImp.giugno,
      prec.contributi - prec.accontiContributi + accContr.giugno, false);
    voce(`${anno}-11-30`, `2° acconto ${anno}`, accImp.novembre, accContr.novembre, false);
  }
  // Anno successivo: saldo di quest'anno e acconti calcolati su quest'anno.
  const accImpProx = accontoImposta(imposta);
  const accContrProx = accontoContributi(contributi);
  voce(`${anno + 1}-06-30`, `Saldo ${anno} + 1° acconto ${anno + 1}`,
    imposta - accontiImposta + accImpProx.giugno, contributi - accontiContributi + accContrProx.giugno, true);
  voce(`${anno + 1}-11-30`, `2° acconto ${anno + 1}`, accImpProx.novembre, accContrProx.novembre, true);

  // Da accantonare: quanto resta da versare per le tasse di quest'anno.
  const oggiIso = oggi.toISOString().slice(0, 10);
  const versati =
    (`${anno}-06-30` <= oggiIso ? accImp.giugno + accContr.giugno : 0) +
    (`${anno}-11-30` <= oggiIso ? accImp.novembre + accContr.novembre : 0);
  const daAccantonare = cent(Math.max(0, imposta + contributi - versati));

  return {
    anno, incassato: cent(incassato), reddito, contributi, imposta, netto,
    quotaNetta: incassato > 0 ? netto / incassato : 0,
    daAccantonare,
    scadenze: scadenze.filter((s) => s.data >= oggiIso && Math.abs(s.totale) >= 0.01),
    datiMancanti: !prec,
  };
}
