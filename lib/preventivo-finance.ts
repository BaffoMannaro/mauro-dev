// Calcolo importi cliente a partire dallo stato delle tranche dei preventivi
// accettati. Coerente con la logica di StatisticheDashboard:
// - ricevuto = tranche con pagato = true
// - da dare  = resto (tranche non pagate, oppure l'intero totale se non ci sono
//              ancora tranche tracciate)

export interface FinanzaPreventivo {
  totale: number | string;
  stato: string;
  tranches_stato?: { percentuale: number; pagato: boolean }[] | null;
}

export function calcFinanza(preventivi: FinanzaPreventivo[]) {
  const accettati = preventivi.filter(
    (p) => p.stato === 'accettato' || p.stato === 'archiviato'
  );

  let totale = 0;
  let ricevuto = 0;

  for (const p of accettati) {
    const t = Number(p.totale) || 0;
    totale += t;
    if (!p.tranches_stato || p.tranches_stato.length === 0) continue; // tutto da dare
    ricevuto += p.tranches_stato
      .filter((x) => x.pagato)
      .reduce((s, x) => s + (t * x.percentuale) / 100, 0);
  }

  return { totale, ricevuto, daDare: totale - ricevuto, count: accettati.length };
}
