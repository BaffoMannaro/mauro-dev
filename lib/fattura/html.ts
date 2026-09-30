import {
  type Fattura,
  type Soggetto,
  TIPO_DOCUMENTO,
  REGIME_FISCALE,
  NATURA,
  TIPO_CASSA,
  MODALITA_PAGAMENTO,
} from './parse';

const CONTATTI = 'altamura.mauro@gmail.com · maurodev.it';

// Tracciati di public/Logo.svg
const LOGO_PATHS = `
<path d="M111.98,7.61v132.4c0,2.76-2.23,5-5,5s-5-2.24-5-5V22.35L8.97,143.67c-.96,1.26-2.44,1.96-3.97,1.96-.53,0-1.07-.09-1.6-.27-2.03-.69-3.4-2.59-3.4-4.73V6.69C0,4.54,1.38,2.63,3.41,1.95c2.03-.69,4.28,0,5.58,1.71l47.14,62.06L103.02,4.57c1.3-1.7,3.54-2.38,5.57-1.7,2.03.69,3.39,2.6,3.39,4.74Z"/>
<path d="M215.59,63.11h-10.25V25.42l-17.62,37.69h-9.64l-18.76-38.48v38.48h-10.25V1.67h10.43l23.31,47.77L205.16,1.67h10.43v61.44Z"/>
<path d="M257.75,56.01h-21.56l-2.63,7.1h-11.04L246.97,0l24.54,63.11h-11.04l-2.72-7.1ZM239.52,47.15h14.9l-7.45-21.3-7.45,21.3Z"/>
<path d="M278.43,43.47V1.75h10.25v41.72c.53,7.1,6.22,10.25,12.71,10.25s12.8-3.42,12.8-10.25V1.75h10.25v41.72c0,13.06-9.99,20.51-23.05,20.51s-22.96-7.89-22.96-20.51Z"/>
<path d="M356.79,37.51h-8.33v25.59h-10.25V1.75h20.42s20.51,0,20.51,17.88c0,9.9-6.31,14.29-11.83,16.3l12.53,27.17h-11.31l-11.75-25.59ZM348.46,27.35h10.17s10.25,0,10.25-7.71-10.25-7.62-10.25-7.62h-10.17v15.34Z"/>
<path d="M418.67,63.89c-40.49,0-40.41-62.93,0-62.93s40.32,62.93,0,62.93ZM418.67,10.96c-26.47,0-26.56,43.03,0,43.03s26.56-43.03,0-43.03Z"/>
<path d="M159.41,84.1c14.9,0,35.85,3.42,35.85,30.68s-20.6,30.68-35.85,30.68h-10.25v-61.35h10.25ZM184.92,114.78c0-24.54-25.51-20.68-25.51-20.68v41.37s25.51,3.51,25.51-20.68Z"/>
<path d="M217.43,94.36v15.34h25.5v10.17h-25.5v15.34h30.68v10.25h-40.93v-61.35h40.93v10.25h-30.68Z"/>
<path d="M300.78,84.1l-24.54,62.93-24.45-62.93h11.04l13.41,36.2,13.5-36.2h11.04Z"/>`;

// ─── Formattazione ────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 2400 → "€ 2.400,00" (toLocaleString it-IT non raggruppa le cifre sotto 10.000) */
export const eur = (n: number) => {
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return `${n < 0 ? '−' : ''}€ ${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
};

const qta = (n: number) => n.toLocaleString('it-IT', { maximumFractionDigits: 2 });

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** "2026-09-30" → "30 settembre 2026" (senza passare da Date: niente shift di fuso) */
export function dataLunga(iso: string | null): string {
  const m = iso && /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso ?? '';
  return `${Number(m[3])} ${MESI[Number(m[2]) - 1]} ${m[1]}`;
}

const dataBreve = (iso: string) => iso.split('-').reverse().join('/');

const ibanGruppi = (iban: string) => iban.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();

function naturaLabel(codice: string | null): string {
  if (!codice) return '';
  return NATURA[codice] ?? NATURA[codice.split('.')[0]] ?? codice;
}

// ─── Blocchi ──────────────────────────────────────────────────

function blocco(label: string, s: Soggetto): string {
  const ids = [
    s.piva ? `P.IVA ${esc(s.piva)}` : null,
    s.cf && s.cf !== s.piva?.slice(2) ? `C.F. ${esc(s.cf)}` : null,
  ].filter(Boolean);
  return `
    <div class="party">
      <p class="eyebrow">${label}</p>
      <p class="party-name">${esc(s.nome)}</p>
      ${s.indirizzo ? `<p>${esc(s.indirizzo)}</p>` : ''}
      ${s.localita ? `<p>${esc(s.localita)}</p>` : ''}
      ${ids.length ? `<p class="ids">${ids.join(' · ')}</p>` : ''}
    </div>`;
}

// ─── Documento ────────────────────────────────────────────────

export function nomeFilePdf(f: Fattura): string {
  const tipo = (TIPO_DOCUMENTO[f.tipoDocumento] ?? 'fattura').split(' ')[0];
  return `${tipo}-${f.numero}-${f.data.slice(0, 4)}-${f.committente.nome}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat('.pdf');
}

export interface OpzioniPdf {
  /** false = niente fascia col logo, intestazione compatta su una riga */
  logo?: boolean;
}

export function renderFatturaHtml(f: Fattura, { logo = true }: OpzioniPdf = {}): string {
  const tipoLabel = TIPO_DOCUMENTO[f.tipoDocumento] ?? 'Fattura';
  const forfettario = f.prestatore.regimeFiscale === 'RF19';

  const imponibileServizi = f.linee.reduce((s, l) => s + l.prezzoTotale, 0);
  const imposta = f.riepiloghi.reduce((s, r) => s + r.imposta, 0);
  const naturaIva = f.riepiloghi.find((r) => r.imposta === 0 && r.natura)?.natura ?? null;
  const daPagare = f.pagamenti.length
    ? f.pagamenti.reduce((s, p) => s + p.importo, 0)
    : f.totaleDocumento - (f.ritenuta?.importo ?? 0);

  const pag = f.pagamenti[0];
  const scadenza = pag?.scadenza ?? null;
  const metodo = pag ? MODALITA_PAGAMENTO[pag.modalita] ?? pag.modalita : '—';
  const mostraQta = f.linee.some((l) => l.quantita != null && l.quantita !== 1);

  const righe = f.linee
    .map(
      (l) => `
      <tr>
        <td class="n">${esc(l.numero)}</td>
        <td>
          <p class="desc">${esc(l.descrizione).replace(/\n/g, '<br>')}</p>
          ${l.aliquotaIva === 0 && l.natura ? `<p class="sub">IVA: ${esc(naturaLabel(l.natura))}</p>` : ''}
        </td>
        ${mostraQta ? `<td class="r">${l.quantita != null ? qta(l.quantita) : ''}${l.unitaMisura ? ' ' + esc(l.unitaMisura) : ''}</td>` : ''}
        <td class="r">${eur(l.prezzoUnitario)}</td>
        ${l.aliquotaIva > 0 ? `<td class="r">${qta(l.aliquotaIva)}%</td>` : '<td class="r muted">—</td>'}
        <td class="r strong">${eur(l.prezzoTotale)}</td>
      </tr>`
    )
    .join('');

  const totali = [
    ['Imponibile prestazioni', eur(imponibileServizi)],
    ...f.casse.map((c) => [
      `${esc(TIPO_CASSA[c.tipo] ?? c.tipo)} ${qta(c.aliquota)}%`,
      eur(c.importo),
    ]),
    [imposta > 0 ? 'IVA' : `IVA${naturaIva ? ` <span class="muted">(${esc(naturaLabel(naturaIva).toLowerCase())})</span>` : ''}`, eur(imposta)],
  ];

  const note: string[] = [];
  if (forfettario) {
    note.push(
      'Operazione effettuata ai sensi dell’art. 1, commi 54–89, L. 190/2014 – regime forfettario. Operazione senza applicazione dell’IVA.'
    );
    if (!f.ritenuta) {
      note.push('Compenso non soggetto a ritenuta d’acconto ai sensi dell’art. 1, comma 67, L. 190/2014.');
    }
  }
  if (f.bollo) {
    note.push(`Imposta di bollo di ${eur(f.bollo)} assolta in modo virtuale ai sensi del D.M. 17/06/2014 (art. 6).`);
  }
  f.riepiloghi.forEach((r) => r.riferimentoNormativo && note.push(esc(r.riferimentoNormativo)));

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>${esc(tipoLabel)} n. ${esc(f.numero)} — ${esc(f.committente.nome)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #111A1E; --slate: #4C5760; --muted: #5E6E78; --dim: #8A9AA3;
    --edge: #DDE3E6; --wash: #F3F6F7; --accent: #FF006E;
  }
  html, body { background: #fff; }
  body {
    font-family: 'Noto Sans', system-ui, sans-serif; color: var(--ink);
    font-size: 9.5pt; line-height: 1.45;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { width: 210mm; min-height: 297mm; position: relative; display: flex; flex-direction: column; }

  /* Con logo: fascia ardesia, logo e blocco documento centrati sullo stesso asse */
  header.brand { background: var(--slate); color: #fff; padding: 9mm 14mm; display: flex; justify-content: space-between; align-items: center; position: relative; }
  header.brand::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--accent); }
  header.brand svg { height: 14mm; width: auto; fill: #fff; display: block; }
  .doc { text-align: right; }
  .doc .kind { font-size: 8pt; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; opacity: .85; line-height: 1.2; }
  .doc .num { font-size: 24pt; font-weight: 700; line-height: 1.05; letter-spacing: -.01em; }
  .doc .date { font-size: 9pt; opacity: .85; line-height: 1.3; }

  /* Senza logo: nessuna fascia, solo filetto rosa e titolo su una riga */
  header.plain { border-top: 3px solid var(--accent); margin: 0 14mm; padding: 8mm 0 4mm; border-bottom: 1px solid var(--edge); display: flex; justify-content: space-between; align-items: baseline; }
  header.plain h1 { font-size: 16pt; font-weight: 700; letter-spacing: -.01em; }
  header.plain h1 span { color: var(--accent); }
  header.plain .date { color: var(--muted); font-size: 9pt; }
  header.plain .date strong { color: var(--ink); font-weight: 600; }

  main { padding: 10mm 14mm 0; flex: 1; display: flex; flex-direction: column; gap: 8mm; }

  .eyebrow { color: var(--accent); font-size: 7pt; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; margin-bottom: 2mm; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
  .party p { color: var(--muted); }
  .party .party-name { color: var(--ink); font-size: 11pt; font-weight: 700; margin-bottom: .5mm; }
  .party .ids { font-size: 8pt; margin-top: 1mm; }
  .party + .party { border-left: 1px solid var(--edge); padding-left: 10mm; }

  .hero { display: grid; grid-template-columns: 1.4fr 1fr 1fr; background: var(--wash); border-radius: 3mm; overflow: hidden; }
  .hero > div { padding: 5mm 6mm; }
  .hero > div + div { border-left: 1px solid var(--edge); }
  .hero .k { color: var(--muted); font-size: 7.5pt; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
  .hero .v { font-size: 11pt; font-weight: 600; margin-top: 1mm; }
  .hero .big { color: var(--accent); font-size: 20pt; font-weight: 700; line-height: 1.15; }

  table { width: 100%; border-collapse: collapse; }
  thead th { color: var(--dim); font-size: 7pt; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; text-align: left; padding: 0 2mm 2mm; border-bottom: 1.5px solid var(--ink); }
  tbody td { padding: 3.2mm 2mm; border-bottom: 1px solid var(--edge); vertical-align: top; }
  .n { width: 7mm; color: var(--dim); }
  .r { text-align: right; white-space: nowrap; }
  th.r { text-align: right; }
  .desc { font-weight: 600; }
  .sub { color: var(--dim); font-size: 7.5pt; margin-top: .5mm; }
  .strong { font-weight: 700; }
  .muted { color: var(--dim); font-weight: 400; }

  .bottom { display: grid; grid-template-columns: 1fr 72mm; gap: 10mm; align-items: start; }
  .pay { border: 1px solid var(--edge); border-radius: 3mm; padding: 5mm 6mm; position: relative; overflow: hidden; }
  .pay::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--accent); }
  .pay dl { display: grid; grid-template-columns: 19mm 1fr; row-gap: 1.8mm; }
  .pay dt { color: var(--dim); font-size: 8pt; }
  .pay dd { font-weight: 500; }
  .pay .iban { font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 8.8pt; font-weight: 600; white-space: nowrap; }

  .totals div { display: flex; justify-content: space-between; padding: 1.6mm 0; color: var(--muted); }
  .totals div span:last-child { color: var(--ink); white-space: nowrap; }
  .totals .grand { margin-top: 2mm; padding: 3.5mm 4mm; background: var(--ink); color: #fff; border-radius: 2mm; font-weight: 700; }
  .totals .grand span:last-child { color: #fff; font-size: 13pt; }
  .totals .net span { font-weight: 700; color: var(--accent) !important; }

  .notes { color: var(--muted); font-size: 7.5pt; line-height: 1.5; display: flex; flex-direction: column; gap: 1mm; }
  .notes p::before { content: '— '; color: var(--accent); font-weight: 700; }

  footer { margin: auto 14mm 0; padding: 5mm 0 8mm; border-top: 1px solid var(--edge); display: flex; justify-content: space-between; gap: 8mm; font-size: 7.5pt; color: var(--dim); }
  footer strong { color: var(--ink); }
</style>
</head>
<body>
<div class="page">
  ${logo ? `<header class="brand">
    <svg viewBox="0 0 448.88 147.03" aria-label="Mauro Dev">${LOGO_PATHS}</svg>
    <div class="doc">
      <p class="kind">${esc(tipoLabel)}</p>
      <p class="num">N. ${esc(f.numero)}</p>
      <p class="date">${dataLunga(f.data)}</p>
    </div>
  </header>` : `<header class="plain">
    <h1>${esc(tipoLabel)} <span>n. ${esc(f.numero)}</span></h1>
    <p class="date">Emessa il <strong>${dataLunga(f.data)}</strong></p>
  </header>`}

  <main>
    <section class="parties">
      ${blocco('Da', f.prestatore)}
      ${blocco('Fatturato a', f.committente)}
    </section>

    <section class="hero">
      <div><p class="k">Totale da pagare</p><p class="big">${eur(daPagare)}</p></div>
      <div><p class="k">Scadenza</p><p class="v">${scadenza ? dataLunga(scadenza) : '—'}</p></div>
      <div><p class="k">Metodo</p><p class="v">${esc(metodo)}</p></div>
    </section>

    <section>
      <p class="eyebrow">Dettaglio</p>
      <table>
        <thead><tr>
          <th>#</th><th>Descrizione</th>
          ${mostraQta ? '<th class="r">Q.tà</th>' : ''}
          <th class="r">Prezzo</th><th class="r">IVA</th><th class="r">Importo</th>
        </tr></thead>
        <tbody>${righe}</tbody>
      </table>
    </section>

    <section class="bottom">
      <div class="pay">
        <p class="eyebrow">Coordinate di pagamento</p>
        <dl>
          <dt>Beneficiario</dt><dd>${esc(f.prestatore.nome)}</dd>
          ${pag?.iban ? `<dt>IBAN</dt><dd class="iban">${esc(ibanGruppi(pag.iban))}</dd>` : ''}
          ${pag?.istituto ? `<dt>Banca</dt><dd>${esc(pag.istituto)}</dd>` : ''}
          <dt>Causale</dt><dd>${esc(tipoLabel)} n. ${esc(f.numero)} del ${dataBreve(f.data)}</dd>
          ${scadenza ? `<dt>Entro il</dt><dd>${dataBreve(scadenza)}</dd>` : ''}
        </dl>
      </div>
      <div class="totals">
        ${totali.map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('')}
        <div class="grand"><span>Totale documento</span><span>${eur(f.totaleDocumento)}</span></div>
        ${f.ritenuta ? `<div><span>Ritenuta d’acconto ${qta(f.ritenuta.aliquota)}%</span><span>− ${eur(f.ritenuta.importo)}</span></div>
        <div class="net"><span>Netto a pagare</span><span>${eur(daPagare)}</span></div>` : ''}
      </div>
    </section>

    ${f.causale.length ? `<section><p class="eyebrow">Causale</p><p>${esc(f.causale.join(' '))}</p></section>` : ''}

    ${note.length ? `<section class="notes">${note.map((n) => `<p>${n}</p>`).join('')}</section>` : ''}
  </main>

  <footer>
    <div><strong>${esc(f.prestatore.nome)}</strong> · ${CONTATTI}${f.prestatore.regimeFiscale ? ` · ${esc(REGIME_FISCALE[f.prestatore.regimeFiscale] ?? f.prestatore.regimeFiscale)}` : ''}</div>
    <div>Copia di cortesia · l’originale è trasmesso tramite SdI</div>
  </footer>
</div>
</body>
</html>`;
}
