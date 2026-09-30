import { XMLParser } from 'fast-xml-parser';

// ─── Tipi ─────────────────────────────────────────────────────

export interface Soggetto {
  nome: string;
  piva: string | null;
  cf: string | null;
  indirizzo: string;
  localita: string;
  regimeFiscale: string | null;
}

export interface Linea {
  numero: string;
  descrizione: string;
  quantita: number | null;
  unitaMisura: string | null;
  prezzoUnitario: number;
  prezzoTotale: number;
  aliquotaIva: number;
  natura: string | null;
}

export interface Cassa {
  tipo: string;
  aliquota: number;
  importo: number;
}

export interface Riepilogo {
  aliquotaIva: number;
  natura: string | null;
  imponibile: number;
  imposta: number;
  riferimentoNormativo: string | null;
}

export interface Pagamento {
  modalita: string;
  importo: number;
  scadenza: string | null;
  iban: string | null;
  istituto: string | null;
}

export interface Fattura {
  tipoDocumento: string;
  numero: string;
  data: string;
  divisa: string;
  causale: string[];
  prestatore: Soggetto;
  committente: Soggetto;
  /** Recapito SdI del committente (codice destinatario o PEC). */
  codiceDestinatario: string | null;
  pecDestinatario: string | null;
  linee: Linea[];
  casse: Cassa[];
  riepiloghi: Riepilogo[];
  ritenuta: { tipo: string; importo: number; aliquota: number } | null;
  bollo: number | null;
  condizioniPagamento: string | null;
  pagamenti: Pagamento[];
  totaleDocumento: number;
}

// ─── Dizionari codici SdI ─────────────────────────────────────

export const TIPO_DOCUMENTO: Record<string, string> = {
  TD01: 'Fattura',
  TD02: 'Acconto su fattura',
  TD03: 'Acconto su parcella',
  TD04: 'Nota di credito',
  TD05: 'Nota di debito',
  TD06: 'Parcella',
  TD24: 'Fattura differita',
  TD25: 'Fattura differita',
};

export const REGIME_FISCALE: Record<string, string> = {
  RF01: 'Regime ordinario',
  RF02: 'Contribuenti minimi',
  RF19: 'Regime forfettario',
};

export const NATURA: Record<string, string> = {
  N1: 'Escluse ex art. 15',
  'N2.1': 'Non soggette (artt. 7–7-septies)',
  'N2.2': 'Non soggette',
  'N3.1': 'Non imponibili – esportazioni',
  'N3.2': 'Non imponibili – cessioni intracomunitarie',
  'N3.5': 'Non imponibili – dichiarazioni d’intento',
  N4: 'Esenti',
  N5: 'Regime del margine',
  'N6.9': 'Inversione contabile',
  N7: 'IVA assolta in altro stato UE',
};

export const TIPO_CASSA: Record<string, string> = {
  TC01: 'Cassa nazionale previdenza avvocati',
  TC02: 'Cassa previdenza dottori commercialisti',
  TC04: 'Cassa ingegneri e architetti',
  TC22: 'Contributo INPS',
};

export const MODALITA_PAGAMENTO: Record<string, string> = {
  MP01: 'Contanti',
  MP02: 'Assegno',
  MP05: 'Bonifico bancario',
  MP08: 'Carta di pagamento',
  MP12: 'RIBA',
  MP19: 'SEPA Direct Debit',
};

export const CONDIZIONI_PAGAMENTO: Record<string, string> = {
  TP01: 'Pagamento a rate',
  TP02: 'Pagamento completo',
  TP03: 'Anticipo',
};

// ─── Estrazione XML (anche da .p7m) ───────────────────────────

/**
 * Restituisce il testo XML della fattura. Accetta sia il file .xml sia,
 * in modo best-effort, il .xml.p7m firmato (DER o base64).
 */
export function extractXml(bytes: Uint8Array): string {
  let text = new TextDecoder('utf-8').decode(bytes);

  // p7m in base64: nessun tag leggibile, solo caratteri base64
  if (!text.includes('FatturaElettronica') && /^[A-Za-z0-9+/=\s]+$/.test(text.trim())) {
    const bin = atob(text.replace(/\s/g, ''));
    text = new TextDecoder('utf-8').decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }

  const start = text.search(/<\?xml|<([\w-]+:)?FatturaElettronica[\s>]/);
  const endMatch = /<\/([\w-]+:)?FatturaElettronica>/.exec(text);
  if (start === -1 || !endMatch) {
    throw new Error('Il file non contiene una fattura elettronica valida.');
  }
  return text.slice(start, endMatch.index + endMatch[0].length);
}

// ─── Parser ───────────────────────────────────────────────────

const ARRAY_TAGS = new Set([
  'FatturaElettronicaBody',
  'DettaglioLinee',
  'DatiRiepilogo',
  'DatiCassaPrevidenziale',
  'DatiPagamento',
  'DettaglioPagamento',
  'DatiRitenuta',
  'Causale',
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

const num = (v: unknown): number => (v == null || v === '' ? 0 : Number(v));
const str = (v: unknown): string | null => (v == null || v === '' ? null : String(v).trim());

const PARTICELLE = new Set(['di', 'del', 'della', 'dei', 'delle', 'da', 'de', 'e', 'a', 'al', 'alla', 'in']);

/** "VIA PASQUALE PAOLI 69" → "Via Pasquale Paoli 69" (solo se tutto maiuscolo) */
function titleCase(v: string | null): string | null {
  if (!v || v !== v.toUpperCase()) return v;
  return v
    .toLowerCase()
    .replace(/[\p{L}']+/gu, (w, i) =>
      i > 0 && PARTICELLE.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)
    );
}

function soggetto(node: Node): Soggetto {
  const ana = node?.DatiAnagrafici ?? {};
  const a = ana.Anagrafica ?? {};
  const sede = node?.Sede ?? {};
  const nome =
    str(a.Denominazione) ??
    titleCase([str(a.Titolo), str(a.Nome), str(a.Cognome)].filter(Boolean).join(' ')) ??
    '';
  const idIva = ana.IdFiscaleIVA;

  return {
    nome,
    piva: idIva ? `${idIva.IdPaese}${idIva.IdCodice}` : null,
    cf: str(ana.CodiceFiscale),
    indirizzo: [titleCase(str(sede.Indirizzo)), str(sede.NumeroCivico)].filter(Boolean).join(', '),
    localita: [
      str(sede.CAP),
      titleCase(str(sede.Comune)),
      sede.Provincia ? `(${sede.Provincia})` : null,
      sede.Nazione && sede.Nazione !== 'IT' ? sede.Nazione : null,
    ]
      .filter(Boolean)
      .join(' '),
    regimeFiscale: str(ana.RegimeFiscale),
  };
}

export function parseFattura(xml: string): Fattura {
  const parser = new XMLParser({
    ignoreAttributes: true,
    removeNSPrefix: true,
    parseTagValue: false, // tiene P.IVA/CF/numeri fattura come stringhe (zeri iniziali)
    isArray: (name) => ARRAY_TAGS.has(name),
  });

  const root = parser.parse(xml)?.FatturaElettronica;
  if (!root?.FatturaElettronicaHeader || !root?.FatturaElettronicaBody) {
    throw new Error('Struttura FatturaPA non riconosciuta.');
  }

  const header = root.FatturaElettronicaHeader;
  const body = root.FatturaElettronicaBody[0];
  const doc = body.DatiGenerali?.DatiGeneraliDocumento ?? {};
  const beni = body.DatiBeniServizi ?? {};

  const linee: Linea[] = (beni.DettaglioLinee ?? []).map((l: Node) => ({
    numero: String(l.NumeroLinea ?? ''),
    descrizione: String(l.Descrizione ?? '').trim(),
    quantita: l.Quantita != null ? num(l.Quantita) : null,
    unitaMisura: str(l.UnitaMisura),
    prezzoUnitario: num(l.PrezzoUnitario),
    prezzoTotale: num(l.PrezzoTotale),
    aliquotaIva: num(l.AliquotaIVA),
    natura: str(l.Natura),
  }));

  const casse: Cassa[] = (doc.DatiCassaPrevidenziale ?? []).map((c: Node) => ({
    tipo: String(c.TipoCassa),
    aliquota: num(c.AlCassa),
    importo: num(c.ImportoContributoCassa),
  }));

  const riepiloghi: Riepilogo[] = (beni.DatiRiepilogo ?? []).map((r: Node) => ({
    aliquotaIva: num(r.AliquotaIVA),
    natura: str(r.Natura),
    imponibile: num(r.ImponibileImporto),
    imposta: num(r.Imposta),
    riferimentoNormativo: str(r.RiferimentoNormativo),
  }));

  const rit = doc.DatiRitenuta?.[0];
  const ritenuta = rit
    ? { tipo: String(rit.TipoRitenuta), importo: num(rit.ImportoRitenuta), aliquota: num(rit.AliquotaRitenuta) }
    : null;

  const datiPag = body.DatiPagamento?.[0];
  const pagamenti: Pagamento[] = (datiPag?.DettaglioPagamento ?? []).map((p: Node) => ({
    modalita: String(p.ModalitaPagamento ?? ''),
    importo: num(p.ImportoPagamento),
    scadenza: str(p.DataScadenzaPagamento) ?? str(p.DataRiferimentoTerminiPagamento),
    iban: str(p.IBAN),
    istituto: str(p.IstitutoFinanziario),
  }));

  const imponibileTot = riepiloghi.reduce((s, r) => s + r.imponibile + r.imposta, 0);

  return {
    tipoDocumento: String(doc.TipoDocumento ?? 'TD01'),
    numero: String(doc.Numero ?? ''),
    data: String(doc.Data ?? ''),
    divisa: String(doc.Divisa ?? 'EUR'),
    causale: (doc.Causale ?? []).map(String),
    prestatore: soggetto(header.CedentePrestatore),
    committente: soggetto(header.CessionarioCommittente),
    codiceDestinatario: (() => {
      const c = str(header.DatiTrasmissione?.CodiceDestinatario);
      return c && !/^0+$/.test(c) ? c : null; // "0000000" = nessun codice
    })(),
    pecDestinatario: str(header.DatiTrasmissione?.PECDestinatario),
    linee,
    casse,
    riepiloghi,
    ritenuta,
    bollo: doc.DatiBollo ? num(doc.DatiBollo.ImportoBollo) : null,
    condizioniPagamento: str(datiPag?.CondizioniPagamento),
    pagamenti,
    totaleDocumento: doc.ImportoTotaleDocumento != null ? num(doc.ImportoTotaleDocumento) : imponibileTot,
  };
}
