// Pagamenti (anche parziali) di una fattura. Funzioni pure: usate dal server, dalle
// statistiche, dalla pagina Fatture e dal connettore Claude.
//
// - Gli importi dei pagamenti sono centesimi interi (mai float); il totale della fattura
//   (ImportoTotaleDocumento, rivalsa INPS inclusa) è in euro nel DB e si converte qui.
// - Lo stato della fattura deriva dai pagamenti: da_pagare (nulla), parziale, pagata (saldo).
// - pagata_il = data dell'ultimo pagamento quando il saldo è chiuso, altrimenti null.

import { euroCent } from './formato';

export type StatoFattura = 'da_pagare' | 'parziale' | 'pagata';
export const STATI_FATTURA: StatoFattura[] = ['da_pagare', 'parziale', 'pagata'];

/** Pagamento come arriva dal DB (importo in centesimi). */
export interface Pagamento {
  id?: number;
  data: string; // YYYY-MM-DD
  importo_cent: number;
  metodo?: string | null;
  nota?: string | null;
}

/** Euro (numero o testo del DB) → centesimi interi. */
export const inCentesimi = (euro: number | string | null | undefined) => Math.round((Number(euro) || 0) * 100);

/** Centesimi → euro con due decimali. */
export const inEuro = (cent: number) => Math.round(cent) / 100;

/** YYYY-MM-DD di un giorno che esiste davvero (niente 2026-02-30). */
export function dataValida(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, g] = s.split('-').map(Number);
  const d = new Date(Date.UTC(a, m - 1, g));
  return d.getUTCFullYear() === a && d.getUTCMonth() === m - 1 && d.getUTCDate() === g;
}

/** Oggi in Italia (il server gira in UTC), YYYY-MM-DD. */
export const oggiRoma = (adesso = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' }).format(adesso);

export function statoDaPagamenti(totaleCent: number, incassatoCent: number): StatoFattura {
  if (incassatoCent <= 0) return 'da_pagare';
  if (incassatoCent < totaleCent) return 'parziale';
  return 'pagata';
}

export interface RiepilogoPagamenti {
  totale: number; // euro
  incassato: number; // euro
  residuo: number; // euro
  stato: StatoFattura;
  pagata_il: string | null;
}

/** Incassato, residuo, stato e giorno del saldo di una fattura dai suoi pagamenti. */
export function riepilogoPagamenti(totaleEuro: number | string | null, pagamenti: Pagamento[]): RiepilogoPagamenti {
  const totaleCent = inCentesimi(totaleEuro);
  const incassatoCent = pagamenti.reduce((s, p) => s + p.importo_cent, 0);
  const stato = statoDaPagamenti(totaleCent, incassatoCent);
  const ultima = pagamenti.reduce((u, p) => (p.data > u ? p.data : u), '');
  return {
    totale: inEuro(totaleCent),
    incassato: inEuro(incassatoCent),
    residuo: inEuro(Math.max(0, totaleCent - incassatoCent)),
    stato,
    pagata_il: stato === 'pagata' ? ultima : null,
  };
}

/**
 * Controlla un nuovo pagamento. Restituisce il messaggio d'errore, o null se va bene.
 * La somma dei pagamenti non può superare il totale della fattura.
 */
export function validaPagamento(p: { totaleCent: number; incassatoCent: number; importoCent: number; data: unknown }): string | null {
  if (!Number.isInteger(p.importoCent) || p.importoCent <= 0) return 'L’importo del pagamento deve essere maggiore di zero.';
  if (!dataValida(p.data)) return 'Data del pagamento non valida: usa il formato YYYY-MM-DD.';
  const residuo = p.totaleCent - p.incassatoCent;
  if (residuo <= 0) return `La fattura è già saldata (totale ${euroCent(inEuro(p.totaleCent))}): nessun residuo da incassare.`;
  if (p.importoCent > residuo) {
    return `Il pagamento di ${euroCent(inEuro(p.importoCent))} supera il residuo della fattura: ` +
      `restano da incassare ${euroCent(inEuro(residuo))} (totale ${euroCent(inEuro(p.totaleCent))}, già incassati ${euroCent(inEuro(p.incassatoCent))}).`;
  }
  return null;
}

/** Etichetta dello stato per le interfacce. */
export const etichettaStato = (stato: string) =>
  stato === 'pagata' ? 'Pagata' : stato === 'parziale' ? 'Parziale' : 'Da pagare';
