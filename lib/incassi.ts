// Incassi: da dove arrivano i soldi entrati, per le statistiche.
// - Fatture segnate "pagata": valgono per il loro importo, nel mese dell'incasso (pagata_il,
//   altrimenti la data fattura), collegate a un preventivo o no.
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
  created_at: string | Date;
  accettato_at: string | Date | null;
  tranches_stato: TrancheIncasso[] | null;
}

export interface FatturaIncasso {
  preventivo_id: number | null;
  importo: number | string | null;
  data: string | null; // YYYY-MM-DD
  pagata_il?: string | null; // giorno dell'incasso
  stato: string;
}

export interface Incasso {
  data: string; // YYYY-MM-DD
  importo: number;
  preventivo_id: number | null;
  fonte: 'fattura' | 'tranche';
}

/**
 * Giorno YYYY-MM-DD da una data del database: testo ("2026-10-20", "2026-10-20T…")
 * oppure oggetto Date (le colonne timestamp arrivano così), letto nel fuso locale.
 */
export function giorno(d: string | Date | null | undefined): string {
  if (!d) return '';
  if (d instanceof Date) {
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? '' : giorno(t);
}

export const accettato = (p: { stato: string }) => p.stato === 'accettato' || p.stato === 'archiviato';

export function calcolaIncassi(preventivi: PreventivoIncasso[], fatture: FatturaIncasso[]) {
  const pagate = fatture.filter((f) => f.stato === 'pagata' && f.data && Number(f.importo) > 0);
  const daFatture = (f: FatturaIncasso): Incasso => ({
    data: giorno(f.pagata_il) || giorno(f.data), importo: Number(f.importo), preventivo_id: f.preventivo_id, fonte: 'fattura',
  });

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
        fonte: 'tranche' as const,
      }));
    const somma = (xs: Incasso[]) => xs.reduce((s, x) => s + x.importo, 0);
    const scelti = somma(fatt) >= somma(tranche) ? fatt : tranche;
    incassi.push(...scelti);
    perPreventivo.set(p.id, somma(scelti));
  }

  return { incassi, perPreventivo };
}
