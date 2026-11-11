import { describe, expect, it } from 'vitest';
import { dataValida, inCentesimi, oggiRoma, riepilogoPagamenti, statoDaPagamenti, validaPagamento } from './pagamenti';

describe('centesimi', () => {
  it('converte euro (anche testo del DB) in centesimi interi senza errori di virgola mobile', () => {
    expect(inCentesimi(0.1 + 0.2)).toBe(30);
    expect(inCentesimi('1040.00')).toBe(104000);
    expect(inCentesimi(1234.565)).toBe(123457);
    expect(inCentesimi(null)).toBe(0);
  });
});

describe('validazione del pagamento', () => {
  const base = { totaleCent: 104000, incassatoCent: 0, data: '2026-03-10' };

  it('accetta un acconto e il saldo esatto', () => {
    expect(validaPagamento({ ...base, importoCent: 50000 })).toBeNull();
    expect(validaPagamento({ ...base, incassatoCent: 50000, importoCent: 54000 })).toBeNull();
  });

  it('rifiuta importi nulli o negativi', () => {
    expect(validaPagamento({ ...base, importoCent: 0 })).toMatch(/maggiore di zero/);
    expect(validaPagamento({ ...base, importoCent: -100 })).toMatch(/maggiore di zero/);
  });

  it('rifiuta una somma oltre il totale e indica il residuo', () => {
    const err = validaPagamento({ ...base, incassatoCent: 50000, importoCent: 60000 });
    expect(err).toMatch(/supera il residuo/);
    expect(err).toContain('€540,00'); // residuo
    expect(err).toContain('€1.040,00'); // totale
  });

  it('rifiuta pagamenti su una fattura già saldata', () => {
    expect(validaPagamento({ ...base, incassatoCent: 104000, importoCent: 1 })).toMatch(/già saldata/);
  });

  it('rifiuta date non valide', () => {
    expect(validaPagamento({ ...base, importoCent: 100, data: '2026-02-30' })).toMatch(/Data/);
    expect(validaPagamento({ ...base, importoCent: 100, data: '10/03/2026' })).toMatch(/Data/);
    expect(dataValida('2028-02-29')).toBe(true);
    expect(dataValida('2027-02-29')).toBe(false);
  });
});

describe('stato derivato', () => {
  it('da_pagare / parziale / pagata', () => {
    expect(statoDaPagamenti(104000, 0)).toBe('da_pagare');
    expect(statoDaPagamenti(104000, 1)).toBe('parziale');
    expect(statoDaPagamenti(104000, 103999)).toBe('parziale');
    expect(statoDaPagamenti(104000, 104000)).toBe('pagata');
  });

  it('pagata_il = data dell’ultimo pagamento solo a saldo chiuso', () => {
    const p1 = { data: '2026-12-20', importo_cent: 50000 };
    const p2 = { data: '2027-02-05', importo_cent: 54000 };
    expect(riepilogoPagamenti(1040, [p1])).toEqual({ totale: 1040, incassato: 500, residuo: 540, stato: 'parziale', pagata_il: null });
    expect(riepilogoPagamenti('1040.00', [p2, p1])).toEqual({ totale: 1040, incassato: 1040, residuo: 0, stato: 'pagata', pagata_il: '2027-02-05' });
    expect(riepilogoPagamenti(1040, [])).toMatchObject({ stato: 'da_pagare', residuo: 1040, pagata_il: null });
  });
});

describe('oggi in Italia', () => {
  it('usa il fuso Europe/Rome, non UTC', () => {
    // 23:30 UTC del 31 dicembre = 00:30 del 1° gennaio a Roma.
    expect(oggiRoma(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
    expect(oggiRoma(new Date('2026-07-15T10:00:00Z'))).toBe('2026-07-15');
  });
});
