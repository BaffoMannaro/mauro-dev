import sql from '@/lib/db';
import { Chess } from 'chess.js';
import { avanzamento, type Missione } from './missioni';
import { erroriDellaPartita, massimoVantaggio, CONSIGLI_TIPO, NOMI_TIPO, type ErroreAnalizzato, type TipoErrore } from './tipi-errore';
import { leggiPgn, type Review } from './partita';
import { finale as comeFinita } from './statistiche';
import { REPERTORIO } from './repertorio';
import { FINALI } from './finali';
import type { MissioneProgramma, RegoleMissione } from './coach';
import type { Fase } from './fasi';

// Bilancio di una missione: dove sbagli (fase e tipo), vittorie non convertite, uso del tempo,
// e la missione successiva costruita sul problema principale.

export type EsempioErrore = ErroreAnalizzato & { partita_id: number };

export type Bilancio = {
  missione_id: number;
  partite: number;
  analizzate: number;
  errori: number;
  perFase: Record<Fase, number>;
  perTipo: { tipo: TipoErrore; nome: string; n: number; esempi: EsempioErrore[] }[];
  nonConvertite: { partita_id: number; massimo: number; esito: string | null; fine: string }[];
  stalli: number;
  zeitnot: number;
  deviazioni: { partita_id: number; mossa: string; attesa: string; linee: string[] }[];
  problemaPrincipale: TipoErrore | null;
  proposta: MissioneProgramma;
};

const TUTTE = REPERTORIO.map((l) => l.id);

/** Linee del repertorio che passano per la posizione dove Mauro è uscito. */
function lineeDellaDeviazione(pgn: string, ply: number, colore: 'w' | 'b'): string[] {
  const c = new Chess();
  c.loadPgn(pgn);
  const prima = c.history().slice(0, ply - 1);
  return REPERTORIO.filter((l) => l.colore === colore && prima.every((san, i) => l.mosse[i]?.[0] === san) && l.mosse.length >= ply).map((l) => l.id);
}

/** Proposta della missione successiva. Funzione pura: la usano la pagina, il tool MCP e i test. */
export function proponiMissione(b: Omit<Bilancio, 'proposta'>, finaliFatti: string[]): MissioneProgramma {
  const regole: RegoleMissione = { linee: TUTTE, cadenze: ['rapid'], partite: 10, minInRegola: 7, maxPersePerTempo: 0 };
  const drill = [...new Set(b.deviazioni.flatMap((d) => d.linee))];
  if (drill.length) regole.drill = drill;
  const p = b.problemaPrincipale;
  const chiudere = b.nonConvertite.length >= 2 || b.stalli > 0 || p === 'finale';
  const parti: string[] = [];
  let titolo = 'Missione · Consolida';

  if (p === 'regalo' || p === 're') {
    titolo = 'Missione · Controlla prima di muovere';
    regole.maxGraviMedi = 1;
    regole.puzzle = 15;
    parti.push('Prima di OGNI mossa tre domande: 1) cosa minaccia la sua ultima mossa? 2) dopo la mia mossa, quali miei pezzi restano senza difesa o difesi una volta sola? 3) ho io scacchi, catture o minacce?');
  } else if (p === 'occasione') {
    titolo = 'Missione · Cerca la mossa forte';
    regole.puzzle = 20;
    parti.push('Dopo ogni mossa avversaria cerca per prima cosa scacchi, catture e minacce tue: spesso ha appena lasciato qualcosa.');
  } else if (p === 'zeitnot') {
    titolo = 'Missione · Gestisci il tempo';
    parti.push('Gioca veloce le mosse di repertorio e le riprese obbligate; tieni sempre almeno 3 minuti per il finale.');
  }
  if (chiudere) {
    if (titolo === 'Missione · Consolida') titolo = 'Missione · Chiudi le partite vinte';
    const daFare = ['donna-re', 'torre-re', 'pedone-opposizione', 'quadrato'].filter((f) => !finaliFatti.includes(f));
    regole.finali = (daFare.length ? daFare : ['donna-re', 'pedone-opposizione']).slice(0, 3);
    parti.push('Quando sei in vantaggio di un pezzo o più: semplifica, cambia i pezzi, spingi i pedoni passati. Contro un Re solo conta sempre le sue case libere (mai stallo).');
  }
  if (p && p !== 'posizionale') parti.unshift(`Il problema principale della missione precedente: ${NOMI_TIPO[p].toLowerCase()}. ${CONSIGLI_TIPO[p]}`);
  if (drill.length) parti.push(`Prima di iniziare fai i drill delle linee da cui sei uscito: ${drill.map((id) => REPERTORIO.find((l) => l.id === id)?.titolo ?? id).join(', ')}.`);
  if (regole.puzzle) parti.push(`Durante la missione risolvi ${regole.puzzle} puzzle dai tuoi errori.`);
  if (regole.finali) parti.push(`Completa i finali: ${regole.finali.map((f) => FINALI.find((x) => x.id === f)?.titolo ?? f).join(', ')}.`);
  parti.push('10 partite rapid 10+0 con il tuo repertorio.');
  return { codice: 'adattiva', titolo, descrizione: parti.join(' '), regole };
}

export async function bilancioMissione(m: Missione, finaliFatti: string[] = []): Promise<Bilancio> {
  const av = await avanzamento(m);
  const ids = av.partite.map((p) => p.id);
  const righe = ids.length
    ? ((await sql`SELECT id, pgn, review, colore_mio, esito_mio FROM scacchi_partite WHERE id = ANY(${ids}::int[])`) as {
        id: number;
        pgn: string;
        review: Review | null;
        colore_mio: 'w' | 'b';
        esito_mio: string | null;
      }[])
    : [];
  const errori: EsempioErrore[] = [];
  const nonConvertite: Bilancio['nonConvertite'] = [];
  let stalli = 0;
  for (const r of righe) {
    const fine = comeFinita(r.pgn);
    if (!r.review) continue;
    const letta = leggiPgn(r.pgn);
    // La review salvata non ha i tempi: li prendo dal PGN.
    const clk = new Map(letta.mosse.map((x) => [x.ply, x.clk ?? null]));
    const review: Review = { ...r.review, mosse: r.review.mosse.map((x) => ({ ...x, clk: x.clk ?? clk.get(x.ply) ?? null })) };
    for (const e of erroriDellaPartita(review, r.colore_mio, letta.tempoBase ?? null)) errori.push({ ...e, partita_id: r.id });
    const max = massimoVantaggio(review, r.colore_mio);
    if (max >= 0.85 && r.esito_mio !== 'vinta') nonConvertite.push({ partita_id: r.id, massimo: Math.round(max * 100) / 100, esito: r.esito_mio, fine });
    if (fine === 'stallo' && max >= 0.85) stalli++;
  }
  const perFase: Record<Fase, number> = { apertura: 0, mediogioco: 0, finale: 0 };
  for (const e of errori) perFase[e.fase]++;
  const conta = new Map<TipoErrore, EsempioErrore[]>();
  for (const e of errori) for (const t of e.tipi) conta.set(t, [...(conta.get(t) ?? []), e]);
  const perTipo = [...conta.entries()]
    .map(([tipo, es]) => ({ tipo, nome: NOMI_TIPO[tipo], n: es.length, esempi: es.filter((x) => x.classificazione !== 'errore').concat(es.filter((x) => x.classificazione === 'errore')).slice(0, 3) }))
    .sort((a, b) => b.n - a.n);
  const problemaPrincipale = perTipo.find((t) => t.tipo !== 'posizionale' && t.tipo !== 'finale')?.tipo ?? perTipo[0]?.tipo ?? null;
  const deviazioni = av.partite
    .filter((p) => p.aderenza.deviazione)
    .map((p) => {
      const pgn = righe.find((r) => r.id === p.id)?.pgn ?? '';
      const d = p.aderenza.deviazione!;
      return { partita_id: p.id, mossa: d.giocata, attesa: d.attesa, linee: pgn ? lineeDellaDeviazione(pgn, d.ply, p.colore_mio as 'w' | 'b') : [] };
    });
  const base = {
    missione_id: m.id,
    partite: av.giocate,
    analizzate: av.analizzate,
    errori: errori.length,
    perFase,
    perTipo,
    nonConvertite,
    stalli,
    zeitnot: errori.filter((e) => e.tipi.includes('zeitnot')).length,
    deviazioni,
    problemaPrincipale,
  };
  return { ...base, proposta: proponiMissione(base, finaliFatti) };
}

/** Missione da cui partire per il bilancio: quella attiva, altrimenti l'ultima chiusa. */
export async function ultimaMissione(): Promise<Missione | null> {
  const { listaMissioni } = await import('./missioni');
  const tutte = await listaMissioni();
  return tutte.find((x) => x.stato === 'attiva') ?? tutte.find((x) => x.stato === 'completata') ?? tutte[0] ?? null;
}

/** Crea la missione proposta dal bilancio dell'ultima missione chiusa. */
export async function accettaProposta(): Promise<number> {
  const { listaMissioni, creaMissione } = await import('./missioni');
  const { progressiFinali } = await import('./finali-db');
  const tutte = await listaMissioni();
  const chiusa = tutte.find((x) => x.stato === 'completata') ?? tutte.find((x) => x.stato !== 'attiva');
  if (!chiusa) throw new Error('Nessuna missione conclusa da cui partire');
  const fatti = Object.values(await progressiFinali()).filter((p) => p.completato).map((p) => p.finale_id);
  const b = await bilancioMissione(chiusa, fatti);
  return creaMissione(b.proposta);
}
