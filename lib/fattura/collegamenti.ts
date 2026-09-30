// Suggerimento del preventivo a cui collegare una fattura. Funzione pura:
// usata dalla pagina Fatture (browser) e dal connettore Claude (server).

/** "IT 08654590721" → "08654590721" per confrontare P.IVA salvate in formati diversi. */
export const normalizzaId = (v: string | null | undefined) =>
  (v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^IT(?=\d{11}$)/, '');

/** "FUNNEL S.R.L.S" → "funnel": toglie forma societaria, accenti e punteggiatura. */
const normalizzaNome = (v: string | null | undefined) =>
  (v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(s\.?\s?r\.?\s?l\.?\s?s?|s\.?\s?p\.?\s?a|s\.?\s?n\.?\s?c|s\.?\s?a\.?\s?s|ditta|studio)\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export interface PreventivoCollegabile {
  id: number;
  oggetto: string;
  cliente_nome: string;
  cliente_azienda: string | null;
  cliente_id: number | null;
  piva: string | null;
  totale: number;
  stato: string;
  creato_il: string; // YYYY-MM-DD
  fatturato: number; // somma delle fatture già collegate
}

export interface FatturaDaCollegare {
  id?: number;
  data: string;
  importo: number;
  cliente_id: number | null;
  cliente_nome: string;
  cliente_piva: string | null;
  preventivo_id?: number | null;
}

export interface Suggerimento {
  id: number;
  oggetto: string;
  cliente: string;
  totale: number;
  da_fatturare: number;
  punteggio: number;
  motivi: string[];
}

export function suggerisciPreventivi(
  f: FatturaDaCollegare,
  preventivi: PreventivoCollegabile[],
  max = 3
): Suggerimento[] {
  const nomeF = normalizzaNome(f.cliente_nome);
  const pivaF = normalizzaId(f.cliente_piva);
  const paroleF = new Set(nomeF.split(' ').filter((w) => w.length >= 4));

  return preventivi
    .filter((p) => p.stato !== 'rifiutato' && p.creato_il <= f.data)
    .map((p) => {
      let punteggio = 0;
      const motivi: string[] = [];
      // Il contributo della fattura già collegata non conta come "già fatturato".
      const fatturato = p.fatturato - (f.preventivo_id === p.id ? f.importo : 0);
      const residuo = p.totale - fatturato;

      if (f.cliente_id != null && p.cliente_id === f.cliente_id) {
        punteggio += 4;
        motivi.push('stesso cliente');
      }
      if (pivaF && normalizzaId(p.piva).split(/[^0-9A-Z]+/).includes(pivaF)) {
        punteggio += 4;
        motivi.push('stessa P.IVA');
      }
      const nomi = [p.cliente_azienda, p.cliente_nome].map(normalizzaNome).filter(Boolean);
      if (nomeF && nomi.some((n) => n === nomeF || n.includes(nomeF) || nomeF.includes(n))) {
        punteggio += 3;
        motivi.push('stesso nome');
      } else if (nomi.some((n) => n.split(' ').some((w) => paroleF.has(w)))) {
        punteggio += 1;
        motivi.push('nome simile');
      }
      if (Math.abs(p.totale - f.importo) < 1) {
        punteggio += 2;
        motivi.push('stesso importo');
      } else if (f.importo <= residuo + 1) {
        punteggio += 1;
        motivi.push('importo nel residuo');
      }
      if (p.stato === 'accettato') punteggio += 1;

      return {
        id: p.id,
        oggetto: p.oggetto,
        cliente: p.cliente_azienda || p.cliente_nome,
        totale: p.totale,
        da_fatturare: Math.max(0, residuo),
        punteggio,
        motivi,
      };
    })
    .filter((s) => s.punteggio >= 3)
    .sort((a, b) => b.punteggio - a.punteggio || b.id - a.id)
    .slice(0, max);
}
