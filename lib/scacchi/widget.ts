// Widget MCP App: scacchiera interattiva della partita dentro la chat di Claude.
// HTML autonomo: le librerie (ext-apps per parlare con l'host, chess.js per le mosse legali)
// vengono inserite inline leggendole da /scacchi/vendor del sito, così il widget non dipende da CSP o CORS.
import pezzi from './pezzi.json';

export const WIDGET_URI = 'ui://maurodev/scacchi-partita.html';

const cache = new Map<string, string>();

async function libreria(base: string, nome: string): Promise<string> {
  const k = `${base}/${nome}`;
  const c = cache.get(k);
  if (c) return c;
  const r = await fetch(`${base}/scacchi/vendor/${nome}`, { cache: 'force-cache' });
  if (!r.ok) throw new Error(`Impossibile leggere ${nome}: ${r.status}`);
  const js = (await r.text()).replace(/<\/script/gi, '<\\/script');
  cache.set(k, js);
  return js;
}

/** Converte un modulo ESM con `export { a as b, ... }` finale in una variabile globale. */
function comeGlobale(js: string, nome: string): string {
  const i = js.lastIndexOf('export{') >= 0 ? js.lastIndexOf('export{') : js.lastIndexOf('export {');
  if (i < 0) throw new Error('Export non trovato');
  const fine = js.indexOf('}', i);
  const corpo = js.slice(js.indexOf('{', i) + 1, fine);
  const voci = corpo
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [locale, esportato] = s.split(/\s+as\s+/);
      return `${(esportato ?? locale).trim()}: ${locale.trim()}`;
    });
  // IIFE: i due bundle dichiarano nomi top-level che in script classici entrerebbero in conflitto.
  return `(function(){${js.slice(0, i)};window.${nome} = { ${voci.join(', ')} };${js.slice(fine + 1).replace(/^;?/, '')}})();`;
}

export async function htmlWidget(base: string): Promise<string> {
  const [app, chess] = await Promise.all([libreria(base, 'ext-apps.js'), libreria(base, 'chess.js')]);
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>${CSS}</style></head>
<body>
<div id="app"><p class="vuoto">Carico la partita…</p></div>
<script>${comeGlobale(chess, '__chess')}</script>
<script>${comeGlobale(app, '__extApps')}</script>
<script type="module">
const PEZZI = ${JSON.stringify(pezzi)};
${JS}
</script>
</body></html>`;
}

const CSS = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; font: 14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; background: #312e2b; color: #e8e6e3; }
#app { padding: 10px; display: grid; gap: 10px; grid-template-columns: minmax(0, 1fr); max-width: 900px; margin: 0 auto; }
@media (min-width: 640px) { #app { grid-template-columns: minmax(0, 1fr) 280px; } }
.vuoto { color: #8b8987; }
.riga { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 13px; }
.riga .acc { margin-left: auto; background: #3c3a37; padding: 1px 6px; border-radius: 3px; }
.tavolo { display: flex; gap: 6px; }
.barra { width: 16px; border-radius: 3px; background: #403d39; position: relative; overflow: hidden; }
.barra div { position: absolute; left: 0; right: 0; background: #fff; transition: height .4s; }
.board { position: relative; flex: 1; aspect-ratio: 1; display: grid; grid-template-columns: repeat(8, 1fr); border-radius: 3px; overflow: hidden; user-select: none; }
.sq { position: relative; cursor: pointer; }
.sq.l { background: #ebecd0; } .sq.d { background: #739552; }
.sq.hl::before { content: ""; position: absolute; inset: 0; background: rgba(255,255,51,.5); }
.sq.sel::before { content: ""; position: absolute; inset: 0; background: rgba(20,85,30,.5); }
.sq.dot::after { content: ""; position: absolute; inset: 36%; border-radius: 50%; background: rgba(0,0,0,.16); }
.sq svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.sq .coord { position: absolute; font-size: 10px; font-weight: 700; z-index: 1; }
.sq .f { right: 2px; bottom: 0; } .sq .r { left: 2px; top: 0; }
.sq.l .coord { color: #739552; } .sq.d .coord { color: #ebecd0; }
.badge { position: absolute; top: -12%; right: -12%; width: 44%; height: 44%; border-radius: 50%; z-index: 3; color: #fff; font-weight: 800; font-size: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,.5); }
svg.frecce { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
.pannello { background: #262421; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.card { background: #3c3a37; border-radius: 4px; padding: 8px; }
.card.claude { background: #2f3a44; border-left: 3px solid #5c8bb0; }
.card .tit { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #8fb3d1; font-weight: 700; margin-bottom: 4px; }
.mosse { max-height: 190px; overflow-y: auto; font-size: 13px; }
.mosse .m { display: grid; grid-template-columns: 2rem 1fr 1fr; }
.mosse span.n { color: #8b8987; }
.mosse button { all: unset; cursor: pointer; padding: 1px 4px; border-radius: 3px; color: #c3c2c1; font-weight: 600; }
.mosse button.on { background: #484644; color: #fff; }
.nav { display: flex; gap: 4px; }
.btn { all: unset; cursor: pointer; text-align: center; background: #3c3a37; color: #e8e6e3; border-radius: 4px; padding: 6px 8px; font-weight: 600; flex: 1; }
.btn:hover { background: #484644; }
.btn.verde { background: #81b64c; color: #fff; } .btn.verde:hover { background: #a3d160; }
.btn.blu { background: #5c8bb0; color: #fff; }
.piccolo { font-size: 11px; color: #8b8987; }
b { color: #fff; }
`;

// Script del widget (JS puro, eseguito nell'iframe dell'host).
const JS = String.raw`
const { Chess } = window.__chess;
const COLORI = { libro:'#a88865', brillante:'#26c2a3', ottima:'#5c8bb0', migliore:'#81b64c', eccellente:'#81b64c', buona:'#95b776', imprecisione:'#f7c631', errore:'#ffa459', grave:'#fa412d', mancata:'#ee6b55' };
const SIMBOLI = { libro:'▤', brillante:'!!', ottima:'!', migliore:'★', eccellente:'✓', buona:'✓', imprecisione:'?!', errore:'?', grave:'??', mancata:'✕' };
const ETICHETTE = { libro:'di teoria', brillante:'brillante', ottima:'ottima', migliore:'la migliore', eccellente:'eccellente', buona:'buona', imprecisione:"un'imprecisione", errore:'un errore', grave:'un errore grave', mancata:'un\'occasione mancata' };

let D = null;      // dati partita
let ply = 0;
let orient = 'w';
let sel = null;    // casa selezionata per provare una mossa
let prova = null;  // { base, mosse:[uci], fen, analisi }
let mostraMigliore = true;

const { App } = window.__extApps;
const app = new App({ name: 'Scacchi Mauro Dev', version: '1.0.0' }, {});
app.ontoolresult = (r) => {
  const s = r.structuredContent;
  if (!s || !s.mosse) return;
  D = s;
  orient = D.colore_mio === 'b' ? 'b' : 'w';
  ply = Math.max(0, Math.min(D.mosse.length, D.ply ?? 0));
  render();
};
await app.connect();

function evalTxt(e) {
  if (!e) return '';
  if (e.mate !== null && e.mate !== undefined) return e.mate > 0 ? 'M' + e.mate : '-M' + Math.abs(e.mate);
  const x = (e.cp ?? 0) / 100; return (x > 0 ? '+' : '') + x.toFixed(1);
}
function prob(e) {
  if (!e) return 0.5;
  if (e.mate !== null && e.mate !== undefined) return e.mate > 0 ? 1 : 0;
  const cp = Math.max(-1000, Math.min(1000, e.cp ?? 0));
  return 1 / (1 + Math.exp(-0.00368208 * cp));
}
function fenAt(p) { return p === 0 ? D.fenIniziale : D.mosse[p - 1].fen; }

function contesto() {
  if (!D) return;
  const m = ply > 0 ? D.mosse[ply - 1] : null;
  const testo = prova
    ? 'Nel widget Mauro sta provando la variante ' + prova.san.join(' ') + ' dalla posizione dopo la mossa ' + prova.base + ' (FEN ' + prova.fen + ').'
    : 'Nel widget è mostrata la partita ' + D.id + ' alla mossa ' + ply + (m ? ' (' + numero(ply) + ' ' + m.san + ', ' + (m.cls || '') + ')' : ' (posizione iniziale)') + '. FEN: ' + fenAt(ply);
  app.updateModelContext({ content: [{ type: 'text', text: testo }] }).catch(() => {});
}
function numero(p) { return Math.ceil(p / 2) + (p % 2 ? '.' : '...'); }

function chiedi(testo) {
  app.sendMessage({ role: 'user', content: [{ type: 'text', text: testo }] }).catch(() => {});
}

function vai(p) { prova = null; sel = null; ply = Math.max(0, Math.min(D.mosse.length, p)); render(); contesto(); }

function tavola() {
  const fen = prova ? prova.fen : fenAt(ply);
  const g = new Chess(fen);
  const m = !prova && ply > 0 ? D.mosse[ply - 1] : null;
  const ultima = prova ? prova.ultima : m?.uci;
  const legali = sel ? g.moves({ square: sel, verbose: true }).map((x) => x.to) : [];
  const files = 'abcdefgh';
  let html = '';
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const file = orient === 'w' ? files[c] : files[7 - c];
    const rank = orient === 'w' ? 8 - r : r + 1;
    const sq = file + rank;
    const chiara = (c + r) % 2 === 0;
    const pz = g.get(sq);
    const cls = ['sq', chiara ? 'l' : 'd'];
    if (ultima && (ultima.slice(0, 2) === sq || ultima.slice(2, 4) === sq)) cls.push('hl');
    if (sel === sq) cls.push('sel');
    if (legali.includes(sq)) cls.push('dot');
    let inner = pz ? PEZZI[(pz.color) + pz.type.toUpperCase()] : '';
    if (r === 7) inner += '<span class="coord f">' + file + '</span>';
    if (c === 0) inner += '<span class="coord r">' + rank + '</span>';
    if (m && m.cls && ultima && ultima.slice(2, 4) === sq) inner += '<span class="badge" style="background:' + COLORI[m.cls] + '">' + SIMBOLI[m.cls] + '</span>';
    html += '<div class="' + cls.join(' ') + '" data-sq="' + sq + '">' + inner + '</div>';
  }
  // Freccia: mossa migliore (verde) o prima mossa della linea di Claude (blu).
  const frecce = [];
  if (!prova && m && mostraMigliore && m.best && m.best !== m.uci && !['libro','migliore','brillante','ottima'].includes(m.cls)) frecce.push([m.best, '#96be46']);
  const comm = !prova && D.commenti.find((x) => x.ply === ply);
  if (comm && comm.linea && comm.linea.length && ply > 0) {
    try { const mm = new Chess(D.mosse[ply - 1].fenPrima).move(comm.linea[0]); frecce.push([mm.from + mm.to, '#508cdc']); } catch (e) {}
  }
  if (prova && prova.analisi && prova.analisi.migliore) frecce.push([prova.analisi.migliore, '#96be46']);
  const pos = (s) => { const f = files.indexOf(s[0]); const rk = +s[1]; const x = orient === 'w' ? f : 7 - f; const y = orient === 'w' ? 8 - rk : rk - 1; return [x * 12.5 + 6.25, y * 12.5 + 6.25]; };
  let svg = '<svg class="frecce" viewBox="0 0 100 100"><defs>';
  frecce.forEach(([, col], i) => { svg += '<marker id="p' + i + '" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="' + col + '"/></marker>'; });
  svg += '</defs>';
  frecce.forEach(([u, col], i) => {
    const [x1, y1] = pos(u.slice(0, 2)); const [x2, y2] = pos(u.slice(2, 4));
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1; const k = (L - 4.5) / L;
    svg += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + (x1 + dx * k) + '" y2="' + (y1 + dy * k) + '" stroke="' + col + '" stroke-width="2.4" stroke-opacity=".85" marker-end="url(#p' + i + ')"/>';
  });
  svg += '</svg>';
  return html + svg;
}

function render() {
  if (!D) return;
  const m = ply > 0 ? D.mosse[ply - 1] : null;
  const ev = prova ? prova.analisi?.eval : (m ? m.eval : D.mosse[0]?.evalPrima);
  const pb = prob(ev) * 100;
  const sopra = orient === 'w' ? 'b' : 'w';
  const nome = (c) => (c === 'w' ? D.bianco : D.nero) + (D.colore_mio === c ? ' (tu)' : '');
  const acc = (c) => D.accuratezza && D.accuratezza[c] != null ? '<span class="acc">' + D.accuratezza[c].toFixed(1) + '</span>' : '';
  const comm = !prova && D.commenti.find((x) => x.ply === ply);

  let card = '';
  if (prova) {
    card = '<div class="card"><b>Variante provata:</b> ' + prova.san.join(' ') + '<br>Valutazione: <b>' + (prova.analisi ? evalTxt(prova.analisi.eval) : '…') + '</b>' +
      (prova.analisi && prova.analisi.bestSan ? ' · il motore preferisce <b>' + prova.analisi.bestSan + '</b>' : '') + '</div>' +
      '<div class="nav"><button class="btn blu" id="chiediProva">Chiedi a Claude</button><button class="btn" id="annulla">Torna alla partita</button></div>';
  } else if (m) {
    card = '<div class="card"><span style="color:' + COLORI[m.cls] + ';font-weight:700">' + numero(ply) + ' ' + m.san + ' è ' + (ETICHETTE[m.cls] || '') + '</span> <span class="piccolo">' + evalTxt(m.eval) + '</span>' +
      (m.bestSan && m.best !== m.uci && !['libro','migliore','brillante','ottima'].includes(m.cls) ? '<br>La migliore era <b>' + m.bestSan + '</b>' + (m.pv && m.pv.length ? ' <span class="piccolo">(' + m.pv.slice(0, 5).join(' ') + ')</span>' : '') : '') + '</div>' +
      '<div class="nav"><button class="btn verde" id="perche">Perché?</button>' + (m.bestSan && m.best !== m.uci ? '<button class="btn" id="spiegaMigliore">Spiega ' + m.bestSan + '</button>' : '') + '</div>';
  } else {
    card = '<div class="card">' + (D.apertura ? '<b>' + D.apertura + '</b><br>' : '') + 'Usa ◀ ▶ o clicca una mossa. Clicca due case sulla scacchiera per provare una mossa diversa.</div>';
  }
  const commHtml = comm ? '<div class="card claude"><div class="tit">Commento di Claude</div>' + esc(comm.testo) + (comm.linea && comm.linea.length ? '<div class="piccolo" style="margin-top:4px">Linea: ' + comm.linea.join(' ') + '</div>' : '') + '</div>' : '';

  let lista = '';
  for (let i = 0; i < D.mosse.length; i += 2) {
    const a = D.mosse[i], b = D.mosse[i + 1];
    const cella = (x) => x ? '<button data-ply="' + x.ply + '" class="' + (x.ply === ply && !prova ? 'on' : '') + '">' + (x.cls && ['brillante','ottima','imprecisione','errore','grave','mancata'].includes(x.cls) ? '<span style="color:' + COLORI[x.cls] + '">' + SIMBOLI[x.cls] + '</span> ' : '') + x.san + (D.commenti.some((c) => c.ply === x.ply) ? ' <span style="color:#5c8bb0">●</span>' : '') + '</button>' : '<span></span>';
    lista += '<div class="m"><span class="n">' + (i / 2 + 1) + '.</span>' + cella(a) + cella(b) + '</div>';
  }

  document.getElementById('app').innerHTML =
    '<div><div class="riga">' + esc(nome(sopra)) + acc(sopra) + '</div>' +
    '<div class="tavolo" style="margin:6px 0"><div class="barra"><div style="' + (orient === 'w' ? 'bottom:0;' : 'top:0;') + 'height:' + pb + '%"></div></div><div class="board" id="board">' + tavola() + '</div></div>' +
    '<div class="riga">' + esc(nome(orient)) + acc(orient) + '</div></div>' +
    '<div class="pannello">' + card + commHtml +
    '<div class="mosse" id="mosse">' + lista + '</div>' +
    '<div class="nav"><button class="btn" data-go="0">⏮</button><button class="btn" data-go="-1">◀</button><button class="btn" data-go="1">▶</button><button class="btn" data-go="99">⏭</button><button class="btn" id="gira">⇅</button></div>' +
    (D.link ? '<a class="piccolo" href="#" id="apri">Apri la Game Review sul sito</a>' : '') + '</div>';

  document.querySelector('#mosse button.on')?.scrollIntoView({ block: 'nearest' });
}

function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]); }

async function provaMossa(da, a) {
  const baseFen = prova ? prova.fen : fenAt(ply);
  const g = new Chess(baseFen);
  let mv;
  try { mv = g.move({ from: da, to: a, promotion: 'q' }); } catch (e) { return false; }
  const base = prova ? prova.base : ply;
  const mosse = [...(prova ? prova.mosse : []), mv.from + mv.to + (mv.promotion || '')];
  const san = [...(prova ? prova.san : []), mv.san];
  prova = { base, mosse, san, fen: g.fen(), ultima: mv.from + mv.to, analisi: null, fenBase: fenAt(base) };
  render(); contesto();
  try {
    const r = await app.callServerTool({ name: 'scacchi_analizza_posizione', arguments: { fen: g.fen(), profondita: 14 } });
    const a2 = r.structuredContent;
    if (prova && prova.mosse.length === mosse.length && a2) { prova.analisi = a2; render(); }
  } catch (e) {}
  return true;
}

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-ply],[data-go],[data-sq],button,a');
  if (!t || !D) return;
  if (t.dataset.ply) return vai(+t.dataset.ply);
  if (t.dataset.go) { const g = +t.dataset.go; return vai(g === 0 ? 0 : g === 99 ? D.mosse.length : ply + g); }
  if (t.dataset.sq) {
    const sq = t.dataset.sq;
    const g = new Chess(prova ? prova.fen : fenAt(ply));
    if (sel && g.moves({ square: sel, verbose: true }).some((x) => x.to === sq)) { const da = sel; sel = null; provaMossa(da, sq); return; }
    const pz = g.get(sq);
    sel = pz && pz.color === g.turn() && sel !== sq ? sq : null;
    render(); return;
  }
  const m = ply > 0 ? D.mosse[ply - 1] : null;
  if (t.id === 'gira') { orient = orient === 'w' ? 'b' : 'w'; render(); }
  else if (t.id === 'annulla') { prova = null; render(); contesto(); }
  else if (t.id === 'perche' && m) chiedi('Partita ' + D.id + ', mossa ' + numero(ply) + ' ' + m.san + ' (classificata ' + m.cls + (m.bestSan ? ', migliore ' + m.bestSan : '') + '). Perché? Spiegamelo con parole semplici e, se serve, salva il commento sulla partita.');
  else if (t.id === 'spiegaMigliore' && m) chiedi('Partita ' + D.id + ', mossa ' + numero(ply) + ': perché ' + m.bestSan + ' era meglio di ' + m.san + '? Qual è l\'idea della linea ' + (m.pv || []).slice(0, 6).join(' ') + '?');
  else if (t.id === 'chiediProva' && prova) chiedi('Partita ' + D.id + ': dopo la mossa ' + prova.base + ' (FEN ' + prova.fenBase + ') ho provato ' + prova.san.join(' ') + '. Valutazione motore ' + (prova.analisi ? evalTxt(prova.analisi.eval) : 'n/d') + '. È una buona idea? Cosa cambia rispetto a quanto giocato?');
  else if (t.id === 'apri') { e.preventDefault(); app.openLink({ url: D.link }).catch(() => {}); }
});
document.addEventListener('keydown', (e) => {
  if (!D) return;
  if (e.key === 'ArrowLeft') vai(ply - 1); else if (e.key === 'ArrowRight') vai(ply + 1);
});
`;
