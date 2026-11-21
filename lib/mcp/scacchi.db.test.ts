import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', async () => {
  const { creaSql } = await import('@/test/db-pglite');
  return { default: creaSql().sql };
});

import { McpServer, InMemoryTransport } from '@modelcontextprotocol/server';
import { Client } from '@modelcontextprotocol/client';
import { registraScacchi } from './scacchi';
import { salvaImpostazioni, salvaPartita } from '@/lib/scacchi/db';
import { WIDGET_URI } from '@/lib/scacchi/widget';

// Il widget legge le librerie dal sito: nei test le prendo da node_modules.
const veraFetch = globalThis.fetch;
globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
  const u = String(url);
  if (u.endsWith('/scacchi/vendor/ext-apps.js'))
    return new Response(readFileSync('node_modules/@modelcontextprotocol/ext-apps/dist/src/app-with-deps.js', 'utf8'));
  if (u.endsWith('/scacchi/vendor/chess.js')) return new Response(readFileSync('node_modules/chess.js/dist/esm/chess.js', 'utf8'));
  return veraFetch(url, init);
}) as typeof fetch;

type Testo = { content: { type: string; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };

let client: Client;
let id: number;

beforeAll(async () => {
  const server = new McpServer({ name: 'test', version: '1.0.0' });
  registraScacchi(server);
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  client = new Client({ name: 'c', version: '1.0.0' });
  await client.connect(b);
  await salvaImpostazioni({ username: 'mauro' });
  id = (await salvaPartita({
    fonte: 'pgn',
    pgn: '[White "mauro"]\n[Black "x"]\n[Result "1-0"]\n\n1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0',
  }))!;
});

afterAll(() => {
  globalThis.fetch = veraFetch;
});

const chiama = async (name: string, args: Record<string, unknown>) => (await client.callTool({ name, arguments: args })) as unknown as Testo;

describe('tool MCP scacchi', () => {
  it('elenca e legge la partita', async () => {
    const lista = JSON.parse((await chiama('scacchi_lista_partite', {})).content[0].text);
    expect(lista[0]).toMatchObject({ id, esito: 'vinta', mauro_col: 'w', analizzata: false });
    const p = JSON.parse((await chiama('scacchi_leggi_partita', { id })).content[0].text);
    expect(p.mosse).toHaveLength(7);
    expect(p.mosse[5]).toMatchObject({ ply: 6, mossa: '3... Nf6', di: 'avversario' });
  });

  it('valuta una variante con Stockfish', async () => {
    const r = await chiama('scacchi_analizza_posizione', {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      mosse: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6'],
      profondita: 10,
    });
    expect(r.structuredContent).toMatchObject({ bestSan: 'Qxf7#', valutazione: 'M1' });
  });

  it('commenti: rifiuta linee illegali, salva quelle valide', async () => {
    const ko = await chiama('scacchi_commenta', { partita_id: id, commenti: [{ ply: 6, testo: 'x', linea: ['Qxf7'] }] });
    expect(ko.isError).toBe(true);
    const ok = await chiama('scacchi_commenta', { partita_id: id, commenti: [{ ply: 6, testo: 'Difendi f7', linea: ['g6'] }] });
    expect(JSON.parse(ok.content[0].text).salvati).toBe(1);
  });

  it('widget: tool con UI e risorsa HTML autonoma', async () => {
    const { tools } = await client.listTools();
    const t = tools.find((x) => x.name === 'scacchi_mostra_partita');
    expect((t?._meta as { ui?: { resourceUri?: string } })?.ui?.resourceUri).toBe(WIDGET_URI);
    const r = await chiama('scacchi_mostra_partita', { id, ply: 6 });
    expect(r.structuredContent).toMatchObject({ id, ply: 6 });
    expect((r.structuredContent!.commenti as unknown[]).length).toBe(1);
    const res = await client.readResource({ uri: WIDGET_URI });
    const html = (res.contents[0] as { text: string }).text;
    expect(html).toContain('window.__extApps');
    expect(html).toContain('window.__chess');
    expect(html).not.toMatch(/^export\s/m);
  });
});

describe('tool MCP coach', () => {
  it('repertorio, missione e feedback', async () => {
    const rep = JSON.parse((await chiama('scacchi_repertorio', {})).content[0].text);
    expect(rep.length).toBeGreaterThan(5);
    const crea = await chiama('scacchi_crea_missione', { titolo: 'Prova', descrizione: 'Dieci partite rapid di prova', linee: ['b-italiana-piano'], partite: 3 });
    const { id: mid } = JSON.parse(crea.content[0].text);
    const stato = JSON.parse((await chiama('scacchi_coach_stato', {})).content[0].text);
    expect(stato.missione_attiva).toMatchObject({ id: mid, giocate: 0 });
    const fb = await chiama('scacchi_feedback_missione', { id: mid, feedback: 'Bene così', chiudi: 'annullata' });
    expect(fb.isError).toBeFalsy();
    const ko = await chiama('scacchi_crea_missione', { titolo: 'Prova', descrizione: 'Dieci partite rapid di prova', linee: ['nope'], partite: 3 });
    expect(ko.isError).toBe(true);
  });
});
