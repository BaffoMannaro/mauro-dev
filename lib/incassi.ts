// Incassi: da dove arrivano i soldi entrati, per le statistiche.
// - Fatture segnate "pagata": valgono per il loro importo, nel mese della data fattura
//   (collegate a un preventivo o no).
// - Tranche spuntate dei preventivi accettati: nel mese di data_pagamento.
// Per un preventivo con fatture collegate e tranche spuntate si prende la fonte che vale
// di più, mai la somma: è lo stesso denaro registrato in due modi.

export interface TrancheIncasso {
  percentuale: number;
  pagato: boolean;
  data_pagamento?: string | null;
}

export interface PreventivoIncasso {
  id: number;
  totale: number | string;
  stato: string;
  created_at: string;
  accettato_at: string | null;
  tranches_stato: TrancheIncasso[] | null;
}

export interface FatturaIncasso {
  preventivo_id: number | null;
  importo: number | string | null;
  data: string | null; // YYYY-MM-DD
  stato: string;
}

export interface Incasso {
  data: string; // YYYY-MM-DD
  importo: number;
  preventivo_id: number | null;
}

const giorno = (d: string | null | undefined) => (d ? String(d).slice(0, 10) : '');

export const accettato = (p: { stato: string }) => p.stato === 'accettato' || p.stato === 'archiviato';

export function calcolaIncassi(preventivi: PreventivoIncasso[], fatture: FatturaIncasso[]) {
  const pagate = fatture.filter((f) => f.stato === 'pagata' && f.data && Number(f.importo) > 0);
  const daFatture = (f: FatturaIncasso): Incasso => ({ data: giorno(f.data), importo: Number(f.importo), preventivo_id: f.preventivo_id });

  const incassi: Incasso[] = pagate.filter((f) => f.preventivo_id == null).map(daFatture);
  const perPreventivo = new Map<number, number>();

  // Fatture collegate a preventivi non accettati: contano comunque (sono soldi entrati).
  const idAccettati = new Set(preventivi.filter(accettato).map((p) => p.id));
  for (const f of pagate) {
    if (f.preventivo_id != null && !idAccettati.has(f.preventivo_id)) incassi.push(daFatture(f));
  }

  for (const p of preventivi.filter(accettato)) {
    const totale = Number(p.totale) || 0;
    const fatt = pagate.filter((f) => f.preventivo_id === p.id).map(daFatture);
    const tranche: Incasso[] = (p.tranches_stato ?? [])
      .filter((t) => t.pagato)
      .map((t) => ({
        data: giorno(t.data_pagamento) || giorno(p.accettato_at) || giorno(p.created_at),
        importo: (totale * Number(t.percentuale)) / 100,
        preventivo_id: p.id,
      }));
    const somma = (xs: Incasso[]) => xs.reduce((s, x) => s + x.importo, 0);
    const scelti = somma(fatt) >= somma(tranche) ? fatt : tranche;
    incassi.push(...scelti);
    perPreventivo.set(p.id, somma(scelti));
  }

  return { incassi, perPreventivo };
}
