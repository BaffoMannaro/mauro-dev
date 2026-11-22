// Decide se una PR di Dependabot si puo' unire da sola. Solo funzioni pure: nessuna rete, nessun codice della PR eseguito.
const maggiore = v => { const [a, b, c] = v.split('.').map(x => parseInt(x, 10)); return a > 0 ? `${a}` : b > 0 ? `0.${b}` : `0.0.${c}`; };
const prova = v => /-/.test(v.split('+')[0]);

export function pacchetti(lock) {
  const m = new Map();
  for (const [k, v] of Object.entries(lock.packages ?? {})) {
    if (!k.includes('node_modules/')) continue;
    m.set(k, { nome: v.name ?? k.split('node_modules/').pop(), versione: v.version, da: v.resolved ?? '', integrita: v.integrity, script: !!v.hasInstallScript, link: !!v.link });
  }
  return m;
}

// Confronta per nome di pacchetto: npm sposta i pacchetti tra cartelle anche quando la versione non cambia.
export function differenze(prima, dopo) {
  const insieme = m => { const r = new Map(); for (const p of m.values()) { if (p.link) continue; if (!r.has(p.nome)) r.set(p.nome, new Map()); r.get(p.nome).set(p.versione, p); } return r; };
  const a = insieme(prima), b = insieme(dopo), nuovi = [];
  for (const [nome, versioni] of b) for (const [versione, p] of versioni)
    if (!a.get(nome)?.has(versione)) nuovi.push({ ...p, precedenti: [...(a.get(nome)?.keys() ?? [])] });
  return nuovi;
}

export function valuta(d) {
  const no = [];
  const b = (c, t) => { if (c) no.push(t); };
  b(d.pr.stato !== 'open', 'la PR non e\' aperta');
  b(d.pr.bozza, 'e\' una bozza');
  b(d.pr.autore !== 'dependabot[bot]', `autore ${d.pr.autore}, non dependabot[bot]`);
  b(d.pr.daFork, 'viene da un altro repo');
  b(!d.pr.ramo.startsWith('dependabot/npm_and_yarn/'), `ramo ${d.pr.ramo} inatteso`);
  b(d.pr.base !== d.ramoPrincipale, `base ${d.pr.base}, non ${d.ramoPrincipale}`);
  b(d.pr.etichette.includes('non-unire'), 'etichetta non-unire');
  b(d.pr.unibile !== true, 'conflitti, oppure GitHub non ha ancora deciso se si puo\' unire');
  b(!d.commit.length || d.commit.some(c => c.autore !== 'dependabot[bot]' || !c.verificato), 'commit non firmati da dependabot');
  b(d.richiesteModifica, 'una revisione chiede modifiche');

  const ammessi = new Set(['package.json', 'package-lock.json']);
  const estranei = d.file.filter(f => !ammessi.has(f.nome) || f.stato !== 'modified').map(f => f.nome);
  b(estranei.length, `file non ammessi: ${estranei.join(', ')}`);
  b(!d.file.some(f => f.nome === 'package-lock.json'), 'il lockfile non cambia');
  b(!d.soloVersioni, 'package.json cambia altro oltre alle versioni');

  for (const nome of d.richiesti) {
    const c = d.controlli.filter(x => x.nome === nome);
    b(!c.length, `${nome}: assente`);
    b(c.some(x => !['github-actions', 'vercel[bot]', 'vercel'].includes(x.da)), `${nome}: scritto da ${c.map(x => x.da).join(', ')}`);
    b(c.some(x => x.esito !== 'success'), `${nome}: ${c.map(x => x.esito).join(', ')}`);
  }
  const altri = d.controlli.filter(x => !d.richiesti.includes(x.nome) && !['success', 'neutral', 'skipped'].includes(x.esito));
  b(altri.length, `altri controlli non verdi: ${altri.map(x => `${x.nome} ${x.esito}`).join(', ')}`);

  b(!d.nuovi.length, 'nessun pacchetto cambia versione');
  for (const p of d.nuovi) {
    const chi = `${p.nome} ${p.versione}`;
    b(!p.precedenti.length, `${chi}: pacchetto nuovo, mai stato nel progetto`);
    b(p.precedenti.length && !p.precedenti.some(v => maggiore(v) === maggiore(p.versione)), `${chi}: salto maggiore da ${p.precedenti.join(', ')}`);
    b(prova(p.versione), `${chi}: versione di prova`);
    b(!p.da.startsWith('https://registry.npmjs.org/') || !p.integrita?.startsWith('sha512-'), `${chi}: origine o impronta non valida`);
    b(p.script && !p.scriptPrima, `${chi}: ora esegue codice all'installazione`);
    b(!(p.giorni >= d.giorniMinimi), `${chi}: ${p.giorni == null ? 'data di uscita sconosciuta' : `uscito da ${Math.floor(p.giorni)} giorni, ne servono ${d.giorniMinimi}`}`);
  }
  b(d.avvisi == null, 'avvisi npm non letti');
  if (d.avvisi) {
    b(!d.avvisi.chiusi.length, 'non chiude nessuna vulnerabilita\'');
    b(d.avvisi.aperti.length, `apre vulnerabilita\' nuove: ${d.avvisi.aperti.join(', ')}`);
  }
  return no;
}

export function soloVersioni(prima, dopo) {
  const sezioni = ['dependencies', 'devDependencies', 'optionalDependencies', 'overrides'];
  const senza = o => JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k]) => !sezioni.includes(k))));
  if (senza(prima) !== senza(dopo)) return false;
  return sezioni.every(s => {
    const a = prima[s] ?? {}, b = dopo[s] ?? {};
    if (s === 'overrides') return JSON.stringify(a) === JSON.stringify(b);
    return Object.keys(a).sort().join() === Object.keys(b).sort().join() && Object.values(b).every(v => /^[\^~]?\d/.test(v) || Object.values(a).includes(v));
  });
}
