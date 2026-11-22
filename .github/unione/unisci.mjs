#!/usr/bin/env node
// Guarda le PR aperte di Dependabot. Di norma dice solo cosa farebbe; unisce soltanto con UNISCI=si.
//   GITHUB_REPOSITORY, GH_TOKEN, RICHIESTI="Verifica,Vercel", GIORNI=3
import { pacchetti, differenze, valuta, soloVersioni } from './regole.mjs';
const repo = process.env.GITHUB_REPOSITORY, token = process.env.GH_TOKEN, davvero = process.env.UNISCI === 'si';
const richiesti = (process.env.RICHIESTI ?? 'Verifica,Vercel').split(',').map(s => s.trim()).filter(Boolean);
const giorniMinimi = Number(process.env.GIORNI ?? 3);
if (!repo || !token || !richiesti.length || !(giorniMinimi >= 0)) throw new Error('configurazione mancante');

async function gh(percorso, opz = {}) {
  const r = await fetch(`https://api.github.com/repos/${repo}${percorso}`, { ...opz, headers: { authorization: `Bearer ${token}`, accept: opz.raw ? 'application/vnd.github.raw' : 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`GitHub ${r.status} su ${percorso.split('?')[0]}`);
  return opz.raw ? r.text() : r.json();
}
async function tutte(percorso, campo) {
  const fuori = [];
  for (let p = 1; ; p++) {
    const r = await gh(`${percorso}${percorso.includes('?') ? '&' : '?'}per_page=100&page=${p}`);
    const x = campo ? r[campo] : r; fuori.push(...x);
    if (x.length < 100) return fuori;
  }
}
async function npm(url, corpo) {
  const r = await fetch(`https://registry.npmjs.org/${url}`, { method: corpo ? 'POST' : 'GET', headers: { 'content-type': 'application/json' }, body: corpo && JSON.stringify(corpo), signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`npm ${r.status}`);
  return r.json();
}
async function avvisi(m) {
  const per = {}; for (const p of m.values()) if (!p.link && p.da.startsWith('https://registry.npmjs.org/')) (per[p.nome] ??= new Set()).add(p.versione);
  const r = await npm('-/npm/v1/security/advisories/bulk', Object.fromEntries(Object.entries(per).map(([k, v]) => [k, [...v]])));
  return new Set(Object.entries(r).flatMap(([n, l]) => l.map(a => `${n}:${a.url?.split('/').pop() ?? a.id}`)));
}
const file = (nome, sha) => gh(`/contents/${nome}?ref=${sha}`, { raw: true }).then(JSON.parse);

const info = await gh('');
const aperte = (await tutte('/pulls?state=open')).filter(p => p.user?.login === 'dependabot[bot]');
console.log(`${repo}: ${aperte.length} PR di Dependabot aperte. Modo: ${davvero ? 'UNISCE' : 'solo prova'}`);
let errori = 0;
for (const { number: n } of aperte) try {
  let pr = await gh(`/pulls/${n}`);
  for (let i = 0; pr.mergeable === null && i < 5; i++) { await new Promise(r => setTimeout(r, 3000)); pr = await gh(`/pulls/${n}`); }
  const sha = pr.head.sha;
  const [commit, files, stati, check, rev, confronto] = await Promise.all([tutte(`/pulls/${n}/commits`), tutte(`/pulls/${n}/files`), tutte(`/commits/${sha}/statuses`), tutte(`/commits/${sha}/check-runs?filter=latest`, 'check_runs'), tutte(`/pulls/${n}/reviews`), gh(`/compare/${pr.base.ref}...${sha}`)]);
  const ultima = new Map(); for (const r of rev) if (r.state !== 'COMMENTED') ultima.set(r.user?.login, r.state);
  // L'elenco completo dice chi ha scritto ogni stato; il primo per nome e' il piu' recente.
  const recenti = [...new Map([...stati].reverse().map(s => [s.context, s])).values()];
  const dati = {
    ramoPrincipale: info.default_branch, richiesti, giorniMinimi,
    pr: { stato: pr.state, bozza: pr.draft, autore: pr.user.login, daFork: pr.head.repo?.full_name !== repo, ramo: pr.head.ref, base: pr.base.ref, etichette: pr.labels.map(l => l.name), unibile: pr.mergeable },
    commit: commit.map(c => ({ autore: c.author?.login, verificato: !!c.commit.verification?.verified })),
    richiesteModifica: [...ultima.values()].includes('CHANGES_REQUESTED'),
    file: files.map(f => ({ nome: f.filename, stato: f.status })),
    controlli: [...recenti.map(s => ({ nome: s.context, esito: s.state, da: s.creator?.login })), ...check.filter(c => c.name !== process.env.GITHUB_JOB).map(c => ({ nome: c.name, esito: c.conclusion ?? c.status, da: c.app?.slug }))],
    nuovi: [], avvisi: null, soloVersioni: true,
  };
  if (dati.file.some(f => f.nome === 'package-lock.json')) {
    const base = confronto.merge_base_commit.sha;
    const [l0, l1, p0, p1] = await Promise.all([file('package-lock.json', base), file('package-lock.json', sha), file('package.json', base), file('package.json', sha)]);
    const a = pacchetti(l0), b = pacchetti(l1);
    dati.soloVersioni = soloVersioni(p0, p1);
    dati.nuovi = differenze(a, b);
    for (const p of dati.nuovi) {
      p.scriptPrima = [...a.values()].some(x => x.nome === p.nome && x.script);
      const uscita = await npm(p.nome.replace('/', '%2f')).then(r => r.time?.[p.versione]).catch(() => null);
      p.giorni = uscita ? (Date.now() - Date.parse(uscita)) / 864e5 : null;
    }
    const [v0, v1] = await Promise.all([avvisi(a), avvisi(b)]);
    dati.avvisi = { chiusi: [...v0].filter(x => !v1.has(x)), aperti: [...v1].filter(x => !v0.has(x)) };
  }
  const no = valuta(dati);
  if (no.length) { console.log(`PR ${n} (${sha.slice(0, 7)}): si ferma\n` + no.map(x => `  - ${x}`).join('\n')); continue; }
  console.log(`PR ${n} (${sha.slice(0, 7)}): ${davvero ? 'unisco' : 'si unirebbe'}; chiude ${dati.avvisi.chiusi.join(', ')}`);
  // Lo sha obbliga GitHub a rifiutare se nel frattempo e' arrivato un altro commit.
  if (davvero) await gh(`/pulls/${n}/merge`, { method: 'PUT', body: JSON.stringify({ sha, merge_method: 'squash' }) });
} catch (e) { errori++; console.log(`PR ${n}: non valutata, quindi non unita (${e.message})`); }
process.exitCode = errori ? 1 : 0;
