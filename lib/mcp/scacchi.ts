import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/server';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { Chess } from 'chess.js';
import { leggiPartita, listaPartite, salvaCommenti, type PartitaCompleta } from '@/lib/scacchi/db';
import { importaChesscom } from '@/lib/scacchi/chesscom';
import { analizzaPosizioni } from '@/lib/scacchi/motore-node';
import { leggiPgn } from '@/lib/scacchi/partita';
import { formattaValutazione } from '@/lib/scacchi/classifica';
import { htmlWidget, WIDGET_URI } from '@/lib/scacchi/widget';
import { baseApp } from './oauth';

export const ISTRUZIONI_SCACCHI = `SCACCHI (passione di Mauro, non lavoro): Mauro gioca soprattutto su chess.com e vuole migliorare aperture, mediogioco e finali.
- Le partite arrivano da chess.com (scacchi_importa_chesscom), da PGN incollati o da partite contro il bot sul sito. La Game Review del motore (Stockfish nel browser) classifica ogni mossa: libro, brillante, ottima, migliore, eccellente, buona, imprecisione, errore, grave.
- Per analizzare insieme una partita: scacchi_leggi_partita, poi scacchi_mostra_partita per aprire la scacchiera interattiva in chat sulla mossa di cui parli. Spiega in italiano semplice il PERCHÉ (idea, minaccia, piano, struttura di pedoni), non solo la mossa del motore. Verifica le varianti che proponi con scacchi_analizza_posizione prima di affermarle: non inventare valutazioni.
- Salva le spiegazioni utili con scacchi_commenta (una per mossa, con la linea alternativa in SAN dalla posizione prima della mossa): compaiono sulla scacchiera del sito e del widget.
- Se la partita non è ancora analizzata (analizzata: false), chiedi a Mauro di aprirla sul sito per avviare la review, oppure lavora con scacchi_analizza_posizione sulle posizioni chiave.
- Il ply è il numero di semimossa: 1 = prima mossa del Bianco, 2 = risposta del Nero, ecc.`;

const sola = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

const testo = (data: unknown) => ({
  content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }],
});
const errore = (msg: string) => ({ content: [{ type: 'text' as const, text: msg }], isError: true });

function linkPartita(id: number) {
  return `${baseApp()}/scacchi/partita/${id}`;
}

/** Vista compatta della partita per Claude: una riga per mossa con valutazione e classificazione. */
function vistaPartita(p: PartitaCompleta) {
  const letta = leggiPgn(p.pgn);
  const r = p.review;
  const mosse = letta.mosse.map((m, i) => {
    const x = r?.mosse[i];
    return {
      ply: m.ply,
      mossa: `${Math.ceil(m.ply / 2)}${m.colore === 'w' ? '.' : '...'} ${m.san}`,
      di: m.colore === p.colore_mio ? 'Mauro' : 'avversario',
      ...(x
        ? {
            classificazione: x.classificazione,
            valutazione_dopo: formattaValutazione(x.evalDopo),
            ...(x.migliore !== x.uci ? { migliore: x.migliorSan, linea_migliore: x.pvMigliore.slice(0, 6).join(' ') } : {}),
          }
        : {}),
      fen_prima: m.fenPrima,
    };
  });
  const erroriMiei = r
    ? r.mosse
        .filter((m) => m.colore === p.colore_mio && ['imprecisione', 'errore', 'grave'].includes(m.classificazione))
        .map((m) => ({ ply: m.ply, mossa: m.san, classificazione: m.classificazione, migliore: m.migliorSan, perdita_pct: Math.round(m.perdita * 100) }))
    : [];
  return {
    id: p.id,
    link: linkPartita(p.id),
    bianco: `${p.bianco ?? '?'}${p.elo_bianco ? ` (${p.elo_bianco})` : ''}`,
    nero: `${p.nero ?? '?'}${p.elo_nero ? ` (${p.elo_nero})` : ''}`,
    mauro_col: p.colore_mio === 'w' ? 'bianco' : p.colore_mio === 'b' ? 'nero' : 'sconosciuto',
    risultato: p.risultato,
    esito_mauro: p.esito_mio,
    cadenza: p.cadenza,
    apertura: p.apertura ? `${p.eco} ${p.apertura}` : p.eco,
    data: p.giocata_il,
    analizzata: !!r,
    accuratezza: r ? { bianco: r.accuratezza.w, nero: r.accuratezza.b } : null,
    errori_di_mauro: erroriMiei,
    commenti_salvati: p.commentiLista,
    mosse,
    pgn: p.pgn,
  };
}

/** Dati per il widget: posizione dopo ogni mossa, classificazione e mosse migliori. */
function datiWidget(p: PartitaCompleta, ply: number) {
  const letta = leggiPgn(p.pgn);
  const r = p.review;
  return {
    id: p.id,
    link: linkPartita(p.id),
    bianco: `${p.bianco ?? 'Bianco'}${p.elo_bianco ? ` (${p.elo_bianco})` : ''}`,
    nero: `${p.nero ?? 'Nero'}${p.elo_nero ? ` (${p.elo_nero})` : ''}`,
    colore_mio: p.colore_mio,
    apertura: p.apertura ? `${p.eco} ${p.apertura}` : null,
    accuratezza: r?.accuratezza ?? null,
    fenIniziale: letta.fenIniziale,
    ply,
    mosse: letta.mosse.map((m, i) => {
      const x = r?.mosse[i];
      return {
        ply: m.ply,
        san: m.san,
        uci: m.uci,
        fen: m.fenDopo,
        fenPrima: m.fenPrima,
        cls: x?.classificazione ?? null,
        eval: x?.evalDopo ?? null,
        evalPrima: x?.evalPrima ?? null,
        best: x?.migliore ?? null,
        bestSan: x?.migliorSan ?? null,
        pv: x?.pvMigliore ?? [],
      };
    }),
    commenti: p.commentiLista.map((c) => ({ ply: c.ply, testo: c.testo, linea: c.linea })),
  };
}

export function registraScacchi(server: McpServer) {
  server.registerTool(
    'scacchi_lista_partite',
    {
      title: 'Partite di scacchi',
      description:
        'Elenco delle partite di Mauro (più recenti prima) con esito, apertura, accuratezza e se sono già state analizzate. Filtri facoltativi.',
      inputSchema: z.object({
        esito: z.enum(['vinta', 'persa', 'patta']).optional(),
        apertura: z.string().optional().describe('Parte del nome apertura o codice ECO'),
        colore: z.enum(['w', 'b']).optional().describe('Colore giocato da Mauro'),
        cadenza: z.string().optional().describe('bullet, blitz, rapid, daily, bot'),
        analizzate: z.boolean().optional(),
        limite: z.number().int().min(1).max(200).optional(),
      }),
      annotations: sola,
    },
    async (f) => {
      const righe = await listaPartite(f);
      return testo(
        righe.map((p) => ({
          id: p.id,
          data: p.giocata_il,
          bianco: `${p.bianco} ${p.elo_bianco ?? ''}`.trim(),
          nero: `${p.nero} ${p.elo_nero ?? ''}`.trim(),
          mauro_col: p.colore_mio,
          esito: p.esito_mio,
          cadenza: p.cadenza,
          apertura: p.apertura ? `${p.eco} ${p.apertura}` : p.eco,
          mosse: p.mosse,
          accuratezza_mauro: p.accuratezza_mia,
          analizzata: p.analizzata,
          commenti: p.commenti,
        }))
      );
    }
  );

  server.registerTool(
    'scacchi_leggi_partita',
    {
      title: 'Leggi una partita con la Game Review',
      description:
        'Partita completa: giocatori, apertura, mosse con ply, valutazione del motore, classificazione e mossa migliore, errori di Mauro e commenti già salvati.',
      inputSchema: z.object({ id: z.number().int() }),
      annotations: sola,
    },
    async ({ id }) => {
      const p = await leggiPartita(id);
      return p ? testo(vistaPartita(p)) : errore('Partita non trovata');
    }
  );

  server.registerTool(
    'scacchi_analizza_posizione',
    {
      title: 'Valuta una posizione con Stockfish',
      description:
        'Analizza una posizione (FEN) con Stockfish 19 e restituisce valutazione (dal punto di vista del Bianco) e migliori linee in SAN. ' +
        'Facoltativo: mosse (SAN o UCI) da giocare prima di analizzare, per verificare una variante.',
      inputSchema: z.object({
        fen: z.string(),
        mosse: z.array(z.string()).optional(),
        profondita: z.number().int().min(6).max(20).optional(),
        linee: z.number().int().min(1).max(4).optional(),
      }),
      outputSchema: z.object({
        fen: z.string(),
        eval: z.object({ cp: z.number().nullable(), mate: z.number().nullable() }),
        valutazione: z.string(),
        migliore: z.string().nullable(),
        bestSan: z.string().nullable(),
        linea: z.array(z.string()),
      }),
      annotations: sola,
    },
    async ({ fen, mosse, profondita, linee }) => {
      let g: Chess;
      try {
        g = new Chess(fen);
        for (const m of mosse ?? []) {
          if (/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m)) g.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] });
          else g.move(m);
        }
      } catch (e) {
        return errore(`Mossa o FEN non valida: ${(e as Error).message}`);
      }
      const finale = g.fen();
      const [a] = await analizzaPosizioni([finale], profondita ?? 16, linee ?? 2);
      const san = (uci: string[]) => {
        const c = new Chess(finale);
        const out: string[] = [];
        for (const u of uci.slice(0, 10)) {
          try {
            out.push(c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san);
          } catch {
            break;
          }
        }
        return out;
      };
      const linea = san(a.pv);
      const out = {
        fen: finale,
        eval: { cp: a.eval.cp, mate: a.eval.mate },
        valutazione: formattaValutazione(a.eval),
        migliore: a.migliore,
        bestSan: linea[0] ?? null,
        linea,
      };
      return {
        ...testo({ ...out, seconda_linea: a.seconda ? formattaValutazione(a.seconda) : null, tratto: g.turn() === 'w' ? 'bianco' : 'nero' }),
        structuredContent: out,
      };
    }
  );

  server.registerTool(
    'scacchi_commenta',
    {
      title: 'Salva commenti su una partita',
      description:
        'Salva la spiegazione di una o più mosse (sostituisce un commento già presente sullo stesso ply). ' +
        'linea: mosse in SAN giocabili dalla posizione PRIMA della mossa commentata (cosa andava giocato al posto). ' +
        'ply 0 = commento generale sulla partita. I commenti compaiono sulla scacchiera del sito e nel widget.',
      inputSchema: z.object({
        partita_id: z.number().int(),
        commenti: z
          .array(z.object({ ply: z.number().int().min(0), testo: z.string().min(1), linea: z.array(z.string()).optional() }))
          .min(1),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ partita_id, commenti }) => {
      const p = await leggiPartita(partita_id);
      if (!p) return errore('Partita non trovata');
      const letta = leggiPgn(p.pgn);
      // La linea deve essere giocabile dalla posizione prima della mossa.
      for (const c of commenti) {
        if (!c.linea?.length || c.ply === 0) continue;
        const prima = letta.mosse[c.ply - 1]?.fenPrima;
        if (!prima) return errore(`Ply ${c.ply} fuori dalla partita (1-${letta.mosse.length})`);
        const g = new Chess(prima);
        try {
          for (const m of c.linea) g.move(m);
        } catch {
          return errore(`La linea del ply ${c.ply} (${c.linea.join(' ')}) non è legale dalla posizione prima della mossa`);
        }
      }
      try {
        const n = await salvaCommenti(partita_id, commenti);
        return testo({ salvati: n, link: linkPartita(partita_id) });
      } catch (e) {
        return errore((e as Error).message);
      }
    }
  );

  server.registerTool(
    'scacchi_importa_chesscom',
    {
      title: 'Importa partite da chess.com',
      description: 'Scarica le nuove partite pubbliche di Mauro da chess.com (API pubblica). Al primo import gli ultimi 6 mesi.',
      inputSchema: z.object({ username: z.string().optional().describe('Solo se diverso da quello salvato') }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ username }) => {
      try {
        return testo(await importaChesscom({ username }));
      } catch (e) {
        return errore((e as Error).message);
      }
    }
  );

  // ── Widget: scacchiera interattiva in chat ──

  registerAppResource(
    server,
    'Scacchiera partita',
    WIDGET_URI,
    { description: 'Scacchiera interattiva della Game Review', mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: await htmlWidget(baseApp()),
          _meta: { ui: { prefersBorder: false } },
        },
      ],
    })
  );

  registerAppTool(
    server,
    'scacchi_mostra_partita',
    {
      title: 'Mostra la partita sulla scacchiera',
      description:
        'Apre in chat la scacchiera interattiva della partita, posizionata sul ply indicato: mosse classificate, freccia della mossa migliore, commenti salvati. ' +
        'Mauro può navigare, chiedere "Perché?" su una mossa e provare mosse alternative (valutate dal motore). Usalo quando spieghi una mossa.',
      inputSchema: z.object({ id: z.number().int(), ply: z.number().int().min(0).optional() }),
      annotations: sola,
      _meta: { ui: { resourceUri: WIDGET_URI } },
    },
    async ({ id, ply }: { id: number; ply?: number }) => {
      const p = await leggiPartita(id);
      if (!p) return errore('Partita non trovata');
      const dati = datiWidget(p, ply ?? 0);
      const m = ply ? dati.mosse[ply - 1] : null;
      return {
        content: [
          {
            type: 'text' as const,
            text:
              `Scacchiera aperta: ${dati.bianco} - ${dati.nero}${dati.apertura ? `, ${dati.apertura}` : ''}` +
              (m ? `, alla mossa ${Math.ceil(m.ply / 2)}${m.ply % 2 ? '.' : '...'} ${m.san}${m.cls ? ` (${m.cls})` : ''}.` : '.') +
              (p.review ? '' : ' La partita non è ancora analizzata dal motore.'),
          },
        ],
        structuredContent: dati,
      };
    }
  );
}
