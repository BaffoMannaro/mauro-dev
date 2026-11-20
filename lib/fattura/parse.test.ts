// Regressione del parser FatturaPA (dipende da fast-xml-parser): da rilanciare a ogni aggiornamento.
import { describe, expect, it } from 'vitest';
import { parseFattura } from './parse';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdTrasmittente>
      <ProgressivoInvio>00001</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>M5UXCR1</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>
        <Anagrafica><Nome>Mario</Nome><Cognome>Rossi</Cognome></Anagrafica>
        <RegimeFiscale>RF19</RegimeFiscale>
      </DatiAnagrafici>
      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>70100</CAP><Comune>Bari</Comune><Provincia>BA</Provincia><Nazione>IT</Nazione></Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>00987654321</IdCodice></IdFiscaleIVA>
        <Anagrafica><Denominazione>ESEMPIO S.R.L.</Denominazione></Anagrafica>
      </DatiAnagrafici>
      <Sede><Indirizzo>Via Milano 2</Indirizzo><CAP>20100</CAP><Comune>Milano</Comune><Provincia>MI</Provincia><Nazione>IT</Nazione></Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>2026-11-20</Data>
        <Numero>032</Numero>
        <DatiCassaPrevidenziale>
          <TipoCassa>TC22</TipoCassa><AlCassa>4.00</AlCassa><ImportoContributoCassa>40.00</ImportoContributoCassa>
          <ImponibileCassa>1000.00</ImponibileCassa><AliquotaIVA>0.00</AliquotaIVA><Natura>N2.2</Natura>
        </DatiCassaPrevidenziale>
        <ImportoTotaleDocumento>1040.00</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea><Descrizione>Sito web</Descrizione><Quantita>1.00</Quantita>
        <PrezzoUnitario>600.00</PrezzoUnitario><PrezzoTotale>600.00</PrezzoTotale><AliquotaIVA>0.00</AliquotaIVA><Natura>N2.2</Natura>
      </DettaglioLinee>
      <DettaglioLinee>
        <NumeroLinea>2</NumeroLinea><Descrizione>Manutenzione</Descrizione><Quantita>1.00</Quantita>
        <PrezzoUnitario>400.00</PrezzoUnitario><PrezzoTotale>400.00</PrezzoTotale><AliquotaIVA>0.00</AliquotaIVA><Natura>N2.2</Natura>
      </DettaglioLinee>
      <DatiRiepilogo><AliquotaIVA>0.00</AliquotaIVA><Natura>N2.2</Natura><ImponibileImporto>1040.00</ImponibileImporto><Imposta>0.00</Imposta></DatiRiepilogo>
    </DatiBeniServizi>
    <DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento><ModalitaPagamento>MP05</ModalitaPagamento><DataScadenzaPagamento>2026-12-20</DataScadenzaPagamento><ImportoPagamento>1040.00</ImportoPagamento></DettaglioPagamento>
    </DatiPagamento>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;

describe('parseFattura', () => {
  it('legge numero, data, committente, righe, rivalsa INPS e totale', () => {
    const f = parseFattura(XML);
    expect(f.numero).toBe('032'); // zeri iniziali conservati
    expect(f.data).toBe('2026-11-20');
    expect(f.committente).toMatchObject({ nome: 'ESEMPIO S.R.L.', piva: 'IT00987654321' });
    expect(f.codiceDestinatario).toBe('M5UXCR1');
    expect(f.linee.map((l) => [l.descrizione, l.prezzoTotale])).toEqual([['Sito web', 600], ['Manutenzione', 400]]);
    expect(f.casse.reduce((s, c) => s + c.importo, 0)).toBe(40);
    expect(f.totaleDocumento).toBe(1040);
    expect(f.pagamenti[0]?.scadenza).toBe('2026-12-20');
  });

  it('rifiuta un XML che non è una FatturaPA', () => {
    expect(() => parseFattura('<root><a>1</a></root>')).toThrow(/FatturaPA/);
  });
});
