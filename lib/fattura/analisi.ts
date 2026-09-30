// Analisi dell'archivio fatture: condivisa tra la pagina Fatture e il connettore MCP.

// Limite ricavi/compensi del regime forfettario (L. 190/2014, c. 54).
export const SOGLIA_FORFETTARIO = 85000;
export const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export interface RigaAnalisi {
  anno: number;
  data: string;
  importo: number;
  contributo: number | null;
  stato: string;
  cliente_nome: string;
  cliente_piva: string | null;
}

export function calcolaAnalisi(archivio: RigaAnalisi[], anno: number) {
  const rows = archivio.filter((f) => f.anno === anno);
  const prec = archivio.filter((f) => f.anno === anno - 1);
  const fatturato = rows.reduce((t, f) => t + f.importo, 0);
  const fatturatoPrec = prec.reduce((t, f) => t + f.importo, 0);
  const aperte = rows.filter((f) => f.stato !== 'pagata');
  const daIncassare = aperte.reduce((t, f) => t + f.importo, 0);
  const contributo = rows.reduce((t, f) => t + (f.contributo ?? 0), 0);

  const mesi = MESI.map((label) => ({ label, pagato: 0, aperto: 0, n: 0 }));
  rows.forEach((f) => {
    const m = mesi[Number(f.data.slice(5, 7)) - 1];
    if (!m) return;
    m.n++;
    if (f.stato === 'pagata') m.pagato += f.importo;
    else m.aperto += f.importo;
  });
  const maxMese = Math.max(1, ...mesi.map((m) => m.pagato + m.aperto));

  const perCliente = new Map<string, { nome: string; totale: number; n: number }>();
  rows.forEach((f) => {
    const key = f.cliente_piva || f.cliente_nome;
    const c = perCliente.get(key) ?? { nome: f.cliente_nome, totale: 0, n: 0 };
    c.totale += f.importo;
    c.n++;
    perCliente.set(key, c);
  });
  const clienti = [...perCliente.values()].sort((a, b) => b.totale - a.totale);

  return {
    n: rows.length, fatturato, fatturatoPrec, aperte: aperte.length, daIncassare, contributo,
    mesi, maxMese, clienti,
    delta: fatturatoPrec > 0 ? Math.round(((fatturato - fatturatoPrec) / fatturatoPrec) * 100) : null,
    soglia: Math.min(100, (fatturato / SOGLIA_FORFETTARIO) * 100),
  };
}
