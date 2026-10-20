// Spunta automatica delle tranche di un preventivo dalle fatture collegate e pagate.
// Funzione pura (usata da sincronizzaTranche in server.ts).

export interface TrancheStato {
  descrizione: string;
  percentuale: number;
  pagato: boolean;
  data_pagamento?: string;
  /** Spuntata automaticamente da una fattura pagata collegata. */
  da_fattura?: boolean;
}

export interface IncassoFattura {
  importo: number;
  giorno: string; // YYYY-MM-DD dell'incasso
}

/**
 * Una tranche è pagata quando gli incassi delle fatture (in ordine di data) arrivano al
 * suo totale cumulato, con la data della fattura che la completa. Le spunte automatiche
 * hanno da_fattura e si tolgono se le fatture non le coprono più; quelle a mano restano.
 */
export function trancheDaFatture(base: TrancheStato[], totale: number, pagate: IncassoFattura[]): TrancheStato[] {
  let obiettivo = 0;
  return base.map((t) => {
    obiettivo += (totale * Number(t.percentuale)) / 100;
    let cumulato = 0;
    // Tolleranza per gli arrotondamenti delle percentuali (es. 33,04%).
    const chiude = pagate.find((f) => (cumulato += f.importo) >= obiettivo - Math.max(1, obiettivo * 0.005));
    if (chiude) {
      if (!t.pagato) return { ...t, pagato: true, data_pagamento: chiude.giorno, da_fattura: true };
      return t.da_fattura ? { ...t, data_pagamento: chiude.giorno } : t;
    }
    if (t.da_fattura) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { da_fattura, data_pagamento, ...resto } = t;
      return { ...resto, pagato: false };
    }
    return t;
  });
}
