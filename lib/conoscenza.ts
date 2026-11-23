// Base di conoscenza di Mauro: vive in un repo privato, qui si legge e si aggiorna via API GitHub.
// Il codice e' pubblico, contenuti e token no. Ogni scrittura e' un commit: si annulla con git.

const API = 'https://api.github.com';
const CARTELLA = 'conoscenza/';
const RAMO = 'main';

export class ErroreConoscenza extends Error {}

/** Percorsi relativi a conoscenza/: solo file .md, niente salti di cartella. */
export function percorsoValido(p: string): boolean {
  return /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*\.md$/i.test(p) || /^skills\/[a-z0-9-]+\/SKILL\.md$/.test(p);
}

/**
 * Le correzioni dirette toccano solo i riferimenti: base.md e SKILL.md entrano in ogni sessione,
 * quindi da qui passano soltanto come proposte.
 */
export const correggibile = (p: string) => /^skills\/metodo-mauro\/reference\/[a-z0-9-]+\.md$/.test(p);

export const nomeFile = (titolo: string) =>
  titolo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const unaRiga = (s: string) => s.replace(/\s+/g, ' ').trim();
const oggi = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(new Date());

function config() {
  const token = process.env.CONOSCENZA_TOKEN;
  const repo = process.env.CONOSCENZA_REPO;
  if (!token || !repo) throw new ErroreConoscenza('Base di conoscenza non collegata: mancano CONOSCENZA_TOKEN o CONOSCENZA_REPO su Vercel.');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new ErroreConoscenza('CONOSCENZA_REPO deve essere proprietario/nome.');
  return { token, repo };
}

async function gh<T>(percorso: string, corpo?: unknown, metodo = corpo ? 'POST' : 'GET'): Promise<T> {
  const { token, repo } = config();
  const r = await fetch(`${API}/repos/${repo}${percorso}`, {
    method: metodo,
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
    body: corpo ? JSON.stringify(corpo) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (r.ok) return r.json();
  // Mai riportare il corpo della risposta: basta il motivo.
  if (r.status === 401 || r.status === 403) throw new ErroreConoscenza('GitHub rifiuta il token della base di conoscenza: scaduto o senza permessi.');
  if (r.status === 404) throw new ErroreConoscenza('Non trovato nella base di conoscenza.');
  if (r.status === 409 || r.status === 422) throw new ErroreConoscenza('La base è cambiata nel frattempo: rileggi e riprova. Non ho salvato nulla.');
  throw new ErroreConoscenza(`GitHub non risponde (${r.status}).`);
}

interface Stato { commit: string; albero: string; file: Map<string, string> }

async function stato(): Promise<Stato> {
  const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${RAMO}`);
  const c = await gh<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`);
  const t = await gh<{ truncated: boolean; tree: { path: string; type: string; sha: string }[] }>(`/git/trees/${c.tree.sha}?recursive=1`);
  if (t.truncated) throw new ErroreConoscenza('Elenco dei file incompleto.');
  const file = new Map<string, string>();
  for (const f of t.tree) {
    if (f.type !== 'blob' || !f.path.startsWith(CARTELLA)) continue;
    const p = f.path.slice(CARTELLA.length);
    if (percorsoValido(p)) file.set(p, f.sha);
  }
  return { commit: ref.object.sha, albero: c.tree.sha, file };
}

async function contenuto(s: Stato, p: string): Promise<string> {
  const sha = s.file.get(p);
  if (!sha) throw new ErroreConoscenza(`«${p}» non esiste. Chiama conoscenza_leggi senza percorso per l'elenco.`);
  const b = await gh<{ content: string }>(`/git/blobs/${sha}`);
  return Buffer.from(b.content, 'base64').toString('utf8');
}

/** Un solo commit per tutti i file: o entrano tutti o nessuno. */
async function scrivi(s: Stato, messaggio: string, cambi: Record<string, string>) {
  const t = await gh<{ sha: string }>('/git/trees', {
    base_tree: s.albero,
    tree: Object.entries(cambi).map(([p, content]) => ({ path: CARTELLA + p, mode: '100644', type: 'blob', content })),
  });
  const c = await gh<{ sha: string }>('/git/commits', { message: messaggio, tree: t.sha, parents: [s.commit] });
  await gh(`/git/refs/heads/${RAMO}`, { sha: c.sha, force: false }, 'PATCH');
  return c.sha.slice(0, 7);
}

const conRegistro = async (s: Stato, riga: string) => {
  const r = s.file.has('registro.md') ? await contenuto(s, 'registro.md') : '# Registro\n\n';
  return `${r.trimEnd()}\n- ${oggi()}: ${unaRiga(riga)}\n`;
};

export async function leggi(percorso?: string) {
  if (percorso && !percorsoValido(percorso)) throw new ErroreConoscenza('Percorso non valido.');
  const s = await stato();
  if (percorso) return { percorso, testo: await contenuto(s, percorso) };
  return { file: [...s.file.keys()].sort(), base: await contenuto(s, 'base.md') };
}

export async function cerca(testo: string) {
  const s = await stato();
  const parole = testo.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
  if (!parole.length) throw new ErroreConoscenza('Scrivi almeno una parola di tre lettere.');
  const trovati: { percorso: string; righe: string[] }[] = [];
  for (const p of [...s.file.keys()].sort()) {
    const righe = (await contenuto(s, p)).split('\n').filter((r) => parole.some((w) => r.toLowerCase().includes(w)));
    if (righe.length) trovati.push({ percorso: p, righe: righe.slice(0, 8).map((r) => r.slice(0, 300)) });
  }
  return trovati;
}

export async function salva(x: { percorso: string; regola: string; origine: string; sostituisce?: string }) {
  if (!correggibile(x.percorso)) throw new ErroreConoscenza('Da qui si correggono solo i file in skills/metodo-mauro/reference/. Per il resto usa conoscenza_proponi.');
  const s = await stato();
  const prima = await contenuto(s, x.percorso);
  const riga = `- ${unaRiga(x.regola)} (${unaRiga(x.origine)}, ${oggi()}).`;
  let dopo: string;
  if (x.sostituisce) {
    const righe = prima.split('\n').filter((r) => r === x.sostituisce);
    if (righe.length !== 1) throw new ErroreConoscenza('La riga da sostituire deve comparire identica una sola volta. Rileggi il file.');
    dopo = prima.split('\n').map((r) => (r === x.sostituisce ? riga : r)).join('\n');
  } else {
    dopo = `${prima.trimEnd()}\n${riga}\n`;
  }
  const commit = await scrivi(s, `Conoscenza: ${unaRiga(x.regola).slice(0, 60)}`, {
    [x.percorso]: dopo,
    'registro.md': await conRegistro(s, `${x.sostituisce ? 'cambiata' : 'aggiunta'} una regola in ${x.percorso}: ${x.regola}`),
  });
  return { salvato: true, percorso: x.percorso, riga, commit };
}

export async function proponi(x: { tipo: 'proposta' | 'scheda'; titolo: string; testo: string }) {
  const nome = nomeFile(x.titolo);
  if (!nome) throw new ErroreConoscenza('Titolo non valido.');
  const percorso = x.tipo === 'scheda' ? `schede/${nome}.md` : `proposte/${oggi()}-${nome}.md`;
  const s = await stato();
  if (s.file.has(percorso)) throw new ErroreConoscenza(`«${percorso}» esiste già: leggilo e usa un titolo diverso se è un'altra cosa.`);
  const commit = await scrivi(s, `Conoscenza: ${x.tipo} ${unaRiga(x.titolo).slice(0, 60)}`, {
    [percorso]: `# ${unaRiga(x.titolo)}\n\n${x.testo.trim()}\n`,
    'registro.md': await conRegistro(s, `${x.tipo === 'scheda' ? 'nuova scheda' : 'nuova proposta, in attesa di ok'}: ${percorso}`),
  });
  return { salvato: true, percorso, commit };
}
