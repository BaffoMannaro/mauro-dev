'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Scacchiera, { type Freccia } from './Scacchiera';
import { BarraValutazione, GraficoValutazione, ListaMosse, Navigazione } from './Pannelli';
import { Motore } from '@/lib/scacchi/motore';
import { leggiPgn, type AnalisiPosizione, type Review } from '@/lib/scacchi/partita';
import { analizzaESalva, PROFONDITA_REVIEW as PROFONDITA } from '@/lib/scacchi/review-client';
import { COLORI, ETICHETTE, SIMBOLI, formattaValutazione, type Classificazione, type Valutazione } from '@/lib/scacchi/classifica';
import type { PartitaCompleta } from '@/lib/scacchi/db';
import { suonoMossa } from './suoni';
import { useSetPezzi } from './TemaScacchi';
import { CREDITI_PEZZI } from '@/lib/scacchi/pezzi';

const ORDINE: Classificazione[] = ['brillante', 'ottima', 'migliore', 'eccellente', 'buona', 'libro', 'imprecisione', 'errore', 'grave', 'mancata'];

function frase(c: Classificazione, san: string) {
  switch (c) {
    case 'libro': return `${san} è una mossa di teoria`;
    case 'brillante': return `${san} è brillante!`;
    case 'ottima': return `${san} è un'ottima mossa`;
    case 'migliore': return `${san} è la mossa migliore`;
    case 'eccellente': return `${san} è eccellente`;
    case 'buona': return `${san} è una buona mossa`;
    case 'imprecisione': return `${san} è un'imprecisione`;
    case 'errore': return `${san} è un errore`;
    case 'grave': return `${san} è un errore grave`;
    case 'mancata': return `${san}: occasione mancata`;
  }
}

export default function ReviewPartita({ partita }: { partita: PartitaCompleta }) {
  const letta = useMemo(() => leggiPgn(partita.pgn), [partita.pgn]);
  const setPezzi = useSetPezzi();
  const [review, setReview] = useState<Review | null>(partita.review);
  const [avanzamento, setAvanzamento] = useState<number | null>(null);
  const [ply, setPly] = useState(0);
  const [colore, setColore] = useState<'w' | 'b' | null>(partita.colore_mio);
  const [orient, setOrient] = useState<'white' | 'black'>(partita.colore_mio === 'b' ? 'black' : 'white');
  // Esplorazione: mosse provate a mano partendo da una posizione della partita.
  const [esplora, setEsplora] = useState<{ base: number; mosse: string[]; analisi: AnalisiPosizione | null } | null>(null);
  const [linea, setLinea] = useState<{ base: number; san: string[]; passo: number } | null>(null);
  const motore = useRef<Motore | null>(null);

  const getMotore = () => (motore.current ??= new Motore());
  useEffect(() => () => motore.current?.chiudi(), []);

  const totale = letta.mosse.length;
  const commenti = useMemo(() => new Map(partita.commentiLista.map((c) => [c.ply, c])), [partita.commentiLista]);

  // Avvio automatico della Game Review se manca.
  const avvia = useCallback(async () => {
    const r = await analizzaESalva(getMotore(), partita.id, partita.pgn, setAvanzamento);
    setReview(r);
    setAvanzamento(null);
  }, [partita.id, partita.pgn]);

  const avviata = useRef(false);
  useEffect(() => {
    if (avviata.current || review || totale === 0) return;
    const t = setTimeout(() => {
      avviata.current = true;
      void avvia();
    }, 0);
    return () => clearTimeout(t);
  }, [review, totale, avvia]);

  const salta = useCallback(
    (p: number) => {
      setEsplora(null);
      setLinea(null);
      const nuovo = Math.max(0, Math.min(totale, p));
      if (nuovo === ply + 1) suonoMossa(letta.mosse[nuovo - 1]?.san);
      setPly(nuovo);
    },
    [totale, ply, letta.mosse]
  );

  const mossa = ply > 0 ? review?.mosse[ply - 1] ?? null : null;
  const grezza = ply > 0 ? letta.mosse[ply - 1] : null;

  // Posizione mostrata: partita, linea migliore o esplorazione.
  let fen = ply > 0 ? letta.mosse[ply - 1].fenDopo : letta.fenIniziale;
  let ultima = grezza?.uci ?? null;
  let valutazione: Valutazione | null = mossa?.evalDopo ?? (ply === 0 ? review?.mosse[0]?.evalPrima ?? null : null);
  const frecce: Freccia[] = [];
  if (linea) {
    const c = new Chess(letta.mosse[linea.base - 1].fenPrima);
    let u: string | null = null;
    for (const s of linea.san.slice(0, linea.passo)) {
      const m = c.move(s);
      u = m.from + m.to;
    }
    fen = c.fen();
    ultima = u;
  } else if (esplora) {
    const base = esplora.base > 0 ? letta.mosse[esplora.base - 1].fenDopo : letta.fenIniziale;
    const c = new Chess(base);
    let u: string | null = null;
    for (const x of esplora.mosse) {
      const m = c.move({ from: x.slice(0, 2), to: x.slice(2, 4), promotion: x[4] });
      u = m.from + m.to;
    }
    fen = c.fen();
    ultima = u;
    valutazione = esplora.analisi?.eval ?? null;
    if (esplora.analisi?.migliore) frecce.push({ da: esplora.analisi.migliore.slice(0, 2), a: esplora.analisi.migliore.slice(2, 4), colore: 'rgba(150,190,70,.85)' });
  } else if (mossa && mossa.migliore && mossa.migliore !== mossa.uci && !['libro', 'migliore', 'brillante', 'ottima'].includes(mossa.classificazione)) {
    frecce.push({ da: mossa.migliore.slice(0, 2), a: mossa.migliore.slice(2, 4), colore: 'rgba(150,190,70,.85)' });
  }
  const commento = !esplora && !linea ? commenti.get(ply) : undefined;
  if (commento?.linea?.length && grezza) {
    // Linea suggerita da Claude al posto della mossa giocata: prima mossa come freccia blu.
    try {
      const m = new Chess(grezza.fenPrima).move(commento.linea[0]);
      frecce.push({ da: m.from, a: m.to, colore: 'rgba(80,140,220,.85)' });
    } catch {}
  }

  const onMossaEsplora = (uci: string) => {
    const base = esplora?.base ?? ply;
    const mosse = [...(esplora?.mosse ?? []), uci];
    const c = new Chess(base > 0 ? letta.mosse[base - 1].fenDopo : letta.fenIniziale);
    try {
      for (const x of mosse) c.move({ from: x.slice(0, 2), to: x.slice(2, 4), promotion: x[4] });
    } catch {
      return false;
    }
    suonoMossa(c.history().at(-1));
    setLinea(null);
    setEsplora({ base, mosse, analisi: null });
    getMotore()
      .analizza(c.fen(), 16)
      .then((a) => setEsplora((e) => (e && e.mosse.length === mosse.length ? { ...e, analisi: a } : e)));
    return true;
  };

  const nomi = {
    w: `${partita.bianco ?? 'Bianco'}${partita.elo_bianco ? ` (${partita.elo_bianco})` : ''}`,
    b: `${partita.nero ?? 'Nero'}${partita.elo_nero ? ` (${partita.elo_nero})` : ''}`,
  };
  const sopra = orient === 'white' ? 'b' : 'w';
  const sotto = orient === 'white' ? 'w' : 'b';

  const voci = letta.mosse.map((m, i) => ({
    ply: m.ply,
    san: m.san,
    classificazione: review?.mosse[i]?.classificazione ?? null,
    commento: commenti.has(m.ply),
  }));

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-3 md:p-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Colonna scacchiera */}
      <div className="flex flex-col gap-2">
        <Giocatore nome={nomi[sopra]} acc={review?.accuratezza[sopra] ?? null} sono={colore === sopra} />
        <div className="flex gap-2">
          <BarraValutazione v={valutazione} orientamento={orient} />
          <div className="min-w-0 flex-1">
            <Scacchiera
              fen={fen}
              orientamento={orient}
              ultima={ultima}
              frecce={frecce}
              badge={!esplora && !linea ? mossa?.classificazione ?? null : null}
              onMossa={onMossaEsplora}
            />
          </div>
        </div>
        <Giocatore nome={nomi[sotto]} acc={review?.accuratezza[sotto] ?? null} sono={colore === sotto} />
      </div>

      {/* Pannello laterale */}
      <aside className="flex flex-col gap-3 rounded-lg bg-[#262421] p-3">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="text-[#81b64c]">★</span> Game Review
          </h1>
          <Link href="/scacchi" className="text-sm text-[#c3c2c1] hover:text-white">← Partite</Link>
        </div>

        {avanzamento !== null && (
          <div>
            <p className="mb-1 text-sm text-[#c3c2c1]">Analisi del motore in corso… {Math.round(avanzamento * 100)}%</p>
            <div className="h-2 overflow-hidden rounded bg-[#3c3a37]">
              <div className="h-full bg-[#81b64c] transition-all" style={{ width: `${avanzamento * 100}%` }} />
            </div>
          </div>
        )}

        {/* Mossa corrente */}
        {esplora ? (
          <div className="rounded bg-[#3c3a37] p-3 text-sm text-[#e8e6e3]">
            <p className="font-semibold text-white">Stai esplorando una variante</p>
            <p className="mt-1 text-[#c3c2c1]">
              Valutazione: <b className="text-white">{esplora.analisi ? formattaValutazione(esplora.analisi.eval) : '…'}</b>
              {esplora.analisi?.pv.length ? <> · il motore continua con <b className="text-white">{uciSan(fen, esplora.analisi.pv.slice(0, 4)).join(' ')}</b></> : null}
            </p>
            <button className="mt-2 rounded bg-[#81b64c] px-3 py-1.5 font-semibold text-white hover:bg-[#a3d160]" onClick={() => setEsplora(null)}>
              Torna alla partita
            </button>
          </div>
        ) : mossa ? (
          <div className="rounded bg-[#3c3a37] p-3 text-sm">
            <div className="flex items-center gap-2">
              <Icona c={mossa.classificazione} />
              <p className="font-semibold" style={{ color: COLORI[mossa.classificazione] }}>{frase(mossa.classificazione, mossa.san)}</p>
              <span className="ml-auto rounded bg-[#262421] px-1.5 py-0.5 text-xs font-bold text-white">{formattaValutazione(mossa.evalDopo)}</span>
            </div>
            {mossa.migliorSan && mossa.migliore !== mossa.uci && !['libro', 'migliore', 'brillante', 'ottima'].includes(mossa.classificazione) && (
              <div className="mt-2 flex items-center gap-2 text-[#c3c2c1]">
                <Icona c="migliore" />
                <span>
                  La migliore era <b className="text-white">{mossa.migliorSan}</b> ({formattaValutazione(mossa.evalPrima)})
                </span>
                <button
                  className="ml-auto rounded bg-[#262421] px-2 py-1 text-xs font-semibold text-white hover:bg-[#484644]"
                  onClick={() => setLinea({ base: ply, san: mossa.pvMigliore, passo: 1 })}
                >
                  Mostra linea
                </button>
              </div>
            )}
          </div>
        ) : review ? (
          <Riepilogo review={review} nomi={nomi} />
        ) : null}

        {linea && (
          <div className="rounded bg-[#3c3a37] p-3 text-sm text-[#c3c2c1]">
            <p className="mb-2">
              Linea:{' '}
              {linea.san.map((s, i) => (
                <button key={i} onClick={() => setLinea({ ...linea, passo: i + 1 })} className={`mr-1 rounded px-1 ${i < linea.passo ? 'text-white' : ''} ${i + 1 === linea.passo ? 'bg-[#484644]' : ''}`}>
                  {s}
                </button>
              ))}
            </p>
            <div className="flex gap-1">
              <button className="rounded bg-[#262421] px-2 py-1" onClick={() => setLinea({ ...linea, passo: Math.max(1, linea.passo - 1) })}>◀</button>
              <button className="rounded bg-[#262421] px-2 py-1" onClick={() => setLinea({ ...linea, passo: Math.min(linea.san.length, linea.passo + 1) })}>▶</button>
              <button className="ml-auto rounded bg-[#81b64c] px-3 py-1 font-semibold text-white" onClick={() => setLinea(null)}>Chiudi</button>
            </div>
          </div>
        )}

        {commento && (
          <div className="rounded border-l-4 border-[#5c8bb0] bg-[#2f3a44] p-3 text-sm text-[#e8e6e3]">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#8fb3d1]">Commento di Claude</p>
            <p className="whitespace-pre-line">{commento.testo}</p>
            {commento.linea.length > 0 && (
              <button className="mt-2 rounded bg-[#5c8bb0] px-2 py-1 text-xs font-semibold text-white" onClick={() => setLinea({ base: ply, san: commento.linea, passo: 1 })} disabled={ply === 0}>
                Linea suggerita: {commento.linea.join(' ')}
              </button>
            )}
          </div>
        )}

        {review && (
          <GraficoValutazione
            valori={[review.mosse[0]?.evalPrima ?? { cp: 0, mate: null }, ...review.mosse.map((m) => m.evalDopo)]}
            classi={[null, ...review.mosse.map((m) => m.classificazione)]}
            corrente={ply}
            onSalta={salta}
          />
        )}

        <ListaMosse mosse={voci} corrente={ply} onSalta={salta} />
        <Navigazione corrente={ply} totale={totale} onSalta={salta} onGira={() => setOrient((o) => (o === 'white' ? 'black' : 'white'))} />

        <div className="flex flex-wrap items-center gap-2 border-t border-[#3c3a37] pt-2 text-xs text-[#8b8987]">
          <span>Io ero:</span>
          {(['w', 'b'] as const).map((c) => (
            <button
              key={c}
              className={`rounded px-2 py-0.5 ${colore === c ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37] text-[#c3c2c1]'}`}
              onClick={async () => {
                setColore(c);
                setOrient(c === 'w' ? 'white' : 'black');
                await fetch(`/api/scacchi/partite/${partita.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colore: c }) });
              }}
            >
              {c === 'w' ? 'Bianco' : 'Nero'}
            </button>
          ))}
          {review && avanzamento === null && (
            <button className="ml-auto rounded bg-[#3c3a37] px-2 py-0.5 text-[#c3c2c1]" onClick={() => void avvia()}>Rianalizza</button>
          )}
          {partita.url && <a href={partita.url} target="_blank" rel="noreferrer" className="text-[#c3c2c1] underline">Originale</a>}
        </div>
        <p className="text-[10px] text-[#6f6d6b]">
          Motore Stockfish 19 (GPLv3, <a className="underline" href="https://github.com/nmrugg/stockfish.js" target="_blank" rel="noreferrer">sorgente</a>), profondità {PROFONDITA}. {CREDITI_PEZZI[setPezzi]}. Muovi un pezzo sulla scacchiera per esplorare una variante.
        </p>
      </aside>
    </div>
  );
}

function uciSan(fen: string, uci: string[]) {
  const c = new Chess(fen);
  const out: string[] = [];
  for (const u of uci) {
    try {
      out.push(c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san);
    } catch {
      break;
    }
  }
  return out;
}

function Giocatore({ nome, acc, sono }: { nome: string; acc: number | null; sono: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded bg-[#3c3a37] text-white">♟</span>
      <span className="font-semibold text-white">{nome}</span>
      {sono && <span className="rounded bg-[#81b64c] px-1.5 text-[10px] font-bold text-white">TU</span>}
      {acc !== null && <span className="ml-auto rounded bg-[#3c3a37] px-2 py-0.5 text-xs font-bold text-white">{acc.toFixed(1)}</span>}
    </div>
  );
}

export function Icona({ c }: { c: Classificazione }) {
  return (
    <span
      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
      style={{ background: COLORI[c] }}
      title={ETICHETTE[c]}
    >
      {SIMBOLI[c] || (c === 'libro' ? '▤' : '✓')}
    </span>
  );
}

function Riepilogo({ review, nomi }: { review: Review; nomi: { w: string; b: string } }) {
  return (
    <div className="rounded bg-[#3c3a37] p-3 text-sm text-[#c3c2c1]">
      <div className="mb-2 grid grid-cols-[1fr_4rem_4rem] items-end gap-1 text-center">
        <span />
        <span className="truncate text-xs" title={nomi.w}>Bianco</span>
        <span className="truncate text-xs" title={nomi.b}>Nero</span>
        <span className="text-left font-semibold text-white">Accuratezza</span>
        <span className="rounded bg-white py-1 font-bold text-[#262421]">{review.accuratezza.w?.toFixed(1) ?? '–'}</span>
        <span className="rounded bg-[#262421] py-1 font-bold text-white">{review.accuratezza.b?.toFixed(1) ?? '–'}</span>
      </div>
      {ORDINE.map((c) => (
        <div key={c} className="grid grid-cols-[1fr_4rem_4rem] items-center gap-1 py-0.5 text-center">
          <span className="flex items-center gap-2 text-left"><Icona c={c} /> {ETICHETTE[c]}</span>
          <span style={{ color: COLORI[c] }} className="font-bold">{review.conteggi.w[c]}</span>
          <span style={{ color: COLORI[c] }} className="font-bold">{review.conteggi.b[c]}</span>
        </div>
      ))}
    </div>
  );
}
