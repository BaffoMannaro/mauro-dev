import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cerca, correggibile, leggi, nomeFile, percorsoValido, proponi, salva } from './conoscenza';

// Un GitHub finto in memoria: commit, alberi e file, con il rifiuto se il ramo si e' mosso.
let file: Record<string, string>;
let testa: number;
type Corpo = { tree: { path: string; content: string }[]; parents: string[]; sha: string; force: boolean };
let chiamate: { metodo: string; url: string; corpo?: Corpo }[];
let primaDelPatch: (() => void) | null;
const alberi = new Map<string, Record<string, string>>();

beforeEach(() => {
  process.env.CONOSCENZA_TOKEN = 'segreto-di-prova';
  process.env.CONOSCENZA_REPO = 'x/y';
  file = {
    'conoscenza/base.md': '# Base\n', 'conoscenza/registro.md': '# Registro\n\n- vecchia\n',
    'conoscenza/skills/metodo-mauro/SKILL.md': '# Metodo\n',
    'conoscenza/skills/metodo-mauro/reference/gerarchia.md': '# Gerarchia\n\n- Prima regola sul colore.\n- Seconda.\n',
    'progetti.json': '{"riservato":"colore"}', 'conoscenza/skills/metodo-mauro/esempi/a.png': 'bin',
  };
  testa = 1; chiamate = []; primaDelPatch = null; alberi.clear();
  vi.stubGlobal('fetch', async (url: string, o: { method?: string; body?: string } = {}) => {
    const p = url.replace('https://api.github.com/repos/x/y', ''); const metodo = o.method ?? 'GET'; const corpo = (o.body ? JSON.parse(o.body) : undefined) as Corpo;
    chiamate.push({ metodo, url, corpo });
    const ok = (j: unknown) => ({ ok: true, status: 200, json: async () => j }); const no = (status: number) => ({ ok: false, status, json: async () => ({ message: 'segreto-di-prova' }) });
    if (p === '/git/ref/heads/main') return ok({ object: { sha: `c${testa}` } });
    if (metodo === 'GET' && p.startsWith('/git/commits/')) return ok({ tree: { sha: 't' } });
    if (metodo === 'GET' && p.startsWith('/git/trees/')) return ok({ truncated: false, tree: Object.keys(file).map((path) => ({ path, type: 'blob', sha: encodeURIComponent(path) })) });
    if (p.startsWith('/git/blobs/')) return ok({ content: Buffer.from(file[decodeURIComponent(p.slice(11))]).toString('base64') });
    if (p === '/git/trees') { alberi.set('nuovo', Object.fromEntries(corpo.tree.map((f) => [f.path, f.content]))); return ok({ sha: 'nuovo' }); }
    if (p === '/git/commits') return ok({ sha: `figlio-di-${corpo.parents[0]}` });
    if (metodo === 'PATCH') { primaDelPatch?.(); if (corpo.sha !== `figlio-di-c${testa}` || corpo.force) return no(422); Object.assign(file, alberi.get('nuovo')); testa++; return ok({}); }
    return no(404);
  });
});
afterEach(() => { vi.unstubAllGlobals(); delete process.env.CONOSCENZA_TOKEN; delete process.env.CONOSCENZA_REPO; });

describe('percorsi', () => {
  it('accetta solo file .md dentro la cartella', () => {
    for (const p of ['base.md', 'schede/x-1.md', 'skills/metodo-mauro/SKILL.md']) expect(percorsoValido(p)).toBe(true);
    for (const p of ['../progetti.json', 'a/../b.md', '/base.md', 'a//b.md', '.github/x.md', 'a.yml', 'a\\b.md', 'a%2e.md', 'base.md\n', '']) expect(percorsoValido(p), p).toBe(false);
  });
  it('le correzioni dirette toccano solo i riferimenti', () => {
    expect(correggibile('skills/metodo-mauro/reference/siti.md')).toBe(true);
    for (const p of ['base.md', 'skills/metodo-mauro/SKILL.md', 'regole/ui.md', 'skills/metodo-mauro/reference/../SKILL.md', 'registro.md']) expect(correggibile(p), p).toBe(false);
  });
  it('ricava il nome dal titolo', () => { expect(nomeFile('Perché già ../ così!')).toBe('perche-gia-cosi'); expect(nomeFile('///')).toBe(''); });
});

describe('lettura', () => {
  it('elenca solo i testi della conoscenza', async () => {
    const r = (await leggi()) as { file: string[]; base: string };
    expect(r.base).toContain('# Base'); expect(r.file).not.toContain('progetti.json'); expect(r.file.join()).not.toMatch(/png|\.\./);
  });
  it('non esce dalla cartella', async () => { await expect(leggi('../progetti.json')).rejects.toThrow('non valido'); });
  it('cerca senza toccare il registro dei progetti', async () => {
    const r = await cerca('colore'); expect(r.map((x) => x.percorso)).toEqual(['skills/metodo-mauro/reference/gerarchia.md']);
  });
});

describe('scrittura', () => {
  const g = 'skills/metodo-mauro/reference/gerarchia.md';
  it('aggiunge regola e registro in un solo commit', async () => {
    const r = await salva({ percorso: g, regola: 'Titoli  brevi\n# non un titolo', origine: 'Studio' });
    expect(file[`conoscenza/${g}`]).toMatch(/- Titoli brevi # non un titolo \(Studio, \d{4}-\d\d-\d\d\)\.\n$/);
    expect(file['conoscenza/registro.md']).toMatch(/- vecchia\n- \d{4}-\d\d-\d\d: aggiunta/);
    expect(chiamate.filter((c) => c.metodo === 'PATCH')).toHaveLength(1); expect(r.salvato).toBe(true);
  });
  it('sostituisce solo una riga identica e unica', async () => {
    await salva({ percorso: g, regola: 'Regola nuova sul colore', origine: 'Studio', sostituisce: '- Seconda.' });
    expect(file[`conoscenza/${g}`]).not.toContain('Seconda.');
    await expect(salva({ percorso: g, regola: 'Regola nuova ancora', origine: 'Studio', sostituisce: '- Assente.' })).rejects.toThrow('identica');
  });
  it('non tocca base.md', async () => { await expect(salva({ percorso: 'base.md', regola: 'qualcosa di nuovo', origine: 'x' })).rejects.toThrow('conoscenza_proponi'); expect(chiamate).toHaveLength(0); });
  it('se il ramo si muove non salva nulla', async () => {
    const copia = { ...file }; primaDelPatch = () => { testa++; };
    await expect(proponi({ tipo: 'proposta', titolo: 'Una idea', testo: 'un testo abbastanza lungo' })).rejects.toThrow('Non ho salvato');
    expect(file).toEqual(copia);
  });
  it('proposte e schede non cambiano le regole e non si sovrascrivono', async () => {
    const regole = file[`conoscenza/${g}`];
    const r = await proponi({ tipo: 'scheda', titolo: 'Una Libreria', testo: 'verdetto: prova, per questi motivi' });
    expect(r.percorso).toBe('schede/una-libreria.md'); expect(file[`conoscenza/${g}`]).toBe(regole);
    await expect(proponi({ tipo: 'scheda', titolo: 'Una Libreria', testo: 'verdetto: scarta, per questi motivi' })).rejects.toThrow('esiste già');
  });
});

describe('configurazione', () => {
  it('senza token lo dice e non chiama nessuno', async () => { delete process.env.CONOSCENZA_TOKEN; await expect(leggi()).rejects.toThrow('CONOSCENZA_TOKEN'); expect(chiamate).toHaveLength(0); });
  it('il token non finisce negli errori', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 403, json: async () => ({ message: 'segreto-di-prova' }) }));
    const e = await leggi().catch((x) => x); expect(e.message).toContain('rifiuta'); expect(e.message).not.toContain('segreto');
  });
});
