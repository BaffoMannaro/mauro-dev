// Ripartizione dell'incassato per data di pagamento: una fattura emessa a dicembre e
// saldata a rate l'anno dopo divide incassato, tasse e statistiche tra i due anni.
import { describe, expect, it } from 'vitest';
import { FISCO_BASE, calcolaFisco, incassatoAnno } from './fisco';
import { calcolaIncassi, type FatturaIncasso } from './incassi';
import { calcolaPeriodo } from './statistiche';
import { calcolaAnalisi, type RigaAnalisi } from './fattura/analisi';

// Fattura n. 12 del 2026-12-15, 1.040 € (1.000 + 4% rivalsa INPS): 400 € a dicembre, 640 € a febbraio 2027.
const pagamenti = [
  { data: '2026-12-20', importo_cent: 40000 },
  { data: '2027-02-10', importo_cent: 64000 },
];
const fattura: FatturaIncasso & RigaAnalisi = {
  preventivo_id: null, importo: 1040, data: '2026-12-15', anno: 2026, stato: 'pagata', pagata_il: '2027-02-10',
  contributo: 40, cliente_nome: 'Cliente', cliente_piva: null, pagamenti,
};
// Fattura del 2027 pagata solo in parte.
const parziale: FatturaIncasso & RigaAnalisi = {
  preventivo_id: null, importo: 2080, data: '2027-01-20', anno: 2027, stato: 'parziale', pagata_il: null,
  contributo: 80, cliente_nome: 'Altro', cliente_piva: null, pagamenti: [{ data: '2027-02-01', importo_cent: 100000 }],
};

describe('incassato per data del pagamento', () => {
  it('incassatoAnno divide la fattura tra 2026 e 2027', () => {
    expect(incassatoAnno([fattura], 2026)).toBe(400);
    expect(incassatoAnno([fattura], 2027)).toBe(640);
    expect(incassatoAnno([fattura, parziale], 2027)).toBe(1640);
  });

  it('il netto forfettario di ciascun anno usa solo i pagamenti di quell’anno', () => {
    const f26 = calcolaFisco(2026, incassatoAnno([fattura], 2026), FISCO_BASE, new Date('2027-03-01'));
    const f27 = calcolaFisco(2027, incassatoAnno([fattura], 2027), FISCO_BASE, new Date('2027-03-01'));
    expect(f26.incassato).toBe(400);
    expect(f26.reddito).toBe(268); // 400 × 67%
    expect(f27.reddito).toBe(428.8); // 640 × 67%
    expect(f26.contributi).toBe(Math.round(268 * 0.2607 * 100) / 100);
  });

  it('calcolaIncassi crea un incasso per ogni pagamento, alla sua data', () => {
    const { incassi } = calcolaIncassi([], [fattura]);
    expect(incassi.map((x) => [x.data, x.importo])).toEqual([['2026-12-20', 400], ['2027-02-10', 640]]);
  });

  it('Statistiche: incassato annuale e mensile per data di pagamento', () => {
    const dati = { preventivi: [], fatture: [fattura, parziale], abbonamenti: [], impostazioni: FISCO_BASE };
    const oggi = new Date('2027-12-31T12:00:00');
    const p26 = calcolaPeriodo(2026, dati, oggi);
    const p27 = calcolaPeriodo(2027, dati, oggi);
    expect(p26.incassato).toBe(400);
    expect(p26.barre[11].incassato).toBe(400);
    expect(p27.incassato).toBe(1640);
    expect(p27.barre[1].incassato).toBe(1640); // febbraio
    expect(p27.barre[0].incassato).toBe(0); // gennaio: fattura emessa, nessun pagamento
    expect(calcolaPeriodo('totale', dati, oggi).incassato).toBe(2040);
  });

  it('Analisi fatture: da incassare = totale − pagamenti; mensile per mese del pagamento', () => {
    const s27 = calcolaAnalisi([fattura, parziale], 2027);
    expect(s27.fatturato).toBe(2080);
    expect(s27.daIncassare).toBe(1080);
    expect(s27.parziali).toBe(1);
    expect(s27.incassato).toBe(1640); // comprende i 640 € della fattura 2026
    expect(s27.mesi[1].pagato).toBe(1640);
    expect(s27.mesi[0]).toMatchObject({ pagato: 0, aperto: 1080, n: 1 });

    const s26 = calcolaAnalisi([fattura, parziale], 2026);
    expect(s26.daIncassare).toBe(0);
    expect(s26.mesi[11]).toMatchObject({ pagato: 400, aperto: 0, n: 1 });
  });
});
