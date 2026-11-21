'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Scacchiera, { type Freccia } from './Scacchiera';
import { BarraValutazione } from './Pannelli';
import { suonoMossa } from './suoni';
import { Motore } from '@/lib/scacchi/motore';
import { probPer, type Valutazione } from '@/lib/scacchi/classifica';
import { esitoDopoMiaMossa, esitoDopoRisposta, type EsitoFinale, type Finale } from '@/lib/scacchi/finali';
import { leggiSegni, type ColoreSegno } from '@/lib/scacchi/repertorio';
import type { ProgressoFinale } from '@/lib/scacchi/finali-db';

const COLORE_SEGNO: Record<ColoreSegno, string> = { g: 'rgba(129,182,76,0.9)', r: 'rgba(250,65,45,0.85)', b: 'rgba(80,140,220,0.9)' };
const OBIETTIVO: Record<Finale['obiettivo'], (n: number) => string> = {
  matto: (n) => `Dai scacco matto entro ${n} mosse.`,
  promuovi: (n) => `Promuovi il pedone mantenendo la vittoria, entro ${n} mosse.`,
  patta: (n) => `Tieni la patta per ${n} mosse.`,
};

type Passo = { fen: string; uci: string | null; san: string | null };

export default function FinaleGioco({ finale, progresso }: { finale: Finale; progresso: ProgressoFinale | null }) {
  const [storia, setStoria] = useState<Passo[]>([{ fen: finale.fen, uci: null, san: null }]);
  const [modo, setModo] = useState<'studio' | 'gioco'>('studio');
  const [pensa, setPensa] = useState(false);
  const [valutazione, setValutazione] = useState<Valutazione | null>(null);
  const [esito, setEsito] = useState<EsitoFinale>({ stato: 'continua', messaggio: null });
  const [suggerimento, setSuggerimento] = useState<string | null>(null);
  const [aiuti, setAiuti] = useState(0);
  const [migliore, setMigliore] = useState(progresso?.migliori ?? null);
  const motore = useRef<Motore | null>(null);
  const getMotore = () => (motore.current ??= new Motore());
  useEffect(() => () => motore.current?.chiudi(), []);
  // Valutazione della posizione di partenza per la barra.
  useEffect(() => {
    let vivo = true;
    void getMotore().analizza(finale.fen, 16).then((a) => vivo && setValutazione(a.eval));
    return () => {
      vivo = false;
    };
  }, [finale.fen]);

  const attuale = storia[storia.length - 1];
  const mieMosse = storia.filter((p, i) => i > 0 && (i % 2 === 1)).length; // Mauro muove per primo
  const orient = finale.colore === 'w' ? 'white' : 'black';

  async function registra(riuscito: boolean, mosse: number) {
    if (riuscito && (migliore === null || mosse < migliore)) setMigliore(mosse);
    await fetch('/api/scacchi/finali', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: finale.id, riuscito, mosse }) });
  }

  function statoDi(g: Chess) {
    return { matto: g.isCheckmate(), patta: g.isDraw() || g.isStalemate(), stallo: g.isStalemate() };
  }

  async function onMossa(uci: string) {
    if (modo !== 'gioco' || pensa || esito.stato !== 'continua') return false;
    const g = new Chess(attuale.fen);
    let m;
    try {
      m = g.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    } catch {
      return false;
    }
    suonoMossa(m.san);
    setSuggerimento(null);
    const dopo = [...storia, { fen: g.fen(), uci: m.from + m.to, san: m.san }];
    setStoria(dopo);
    const n = mieMosse + 1;
    const st = statoDi(g);
    let a = null;
    if (!st.matto && !st.patta) {
      setPensa(true);
      a = await getMotore().analizza(g.fen(), 18);
      setValutazione(a.eval);
    }
    const e = esitoDopoMiaMossa(finale, st, a ? probPer(finale.colore, a.eval) : null, !!m.promotion, n);
    if (e.stato !== 'continua' || !a?.migliore) {
      setPensa(false);
      setEsito(e);
      if (e.stato !== 'continua') void registra(e.stato === 'riuscito', n);
      return true;
    }
    // Risposta del motore a piena forza.
    await new Promise((r) => setTimeout(r, 250));
    const r = g.move({ from: a.migliore.slice(0, 2), to: a.migliore.slice(2, 4), promotion: a.migliore[4] });
    suonoMossa(r.san);
    setStoria([...dopo, { fen: g.fen(), uci: r.from + r.to, san: r.san }]);
    setPensa(false);
    const e2 = esitoDopoRisposta(finale, statoDi(g));
    setEsito(e2);
    if (e2.stato !== 'continua') void registra(e2.stato === 'riuscito', n);
    return true;
  }

  function indietro() {
    // Toglie la tua ultima mossa e la risposta del motore.
    const fino = storia.length % 2 === 0 ? storia.length - 1 : storia.length - 2;
    setStoria(storia.slice(0, Math.max(1, fino)));
    setEsito({ stato: 'continua', messaggio: null });
    setSuggerimento(null);
  }

  function ricomincia() {
    setStoria([{ fen: finale.fen, uci: null, san: null }]);
    setEsito({ stato: 'continua', messaggio: null });
    setValutazione(null);
    setSuggerimento(null);
    setAiuti(0);
    setModo('gioco');
  }

  async function aiuto() {
    setPensa(true);
    const a = await getMotore().analizza(attuale.fen, 18);
    setPensa(false);
    if (a.migliore) {
      setSuggerimento(a.migliore);
      setAiuti((x) => x + 1);
    }
  }

  const segni = modo === 'studio' ? leggiSegni(finale.segni) : [];
  const frecce: Freccia[] = segni.flatMap((s) => ('da' in s ? [{ da: s.da, a: s.a, colore: COLORE_SEGNO[s.c] }] : []));
  if (suggerimento) frecce.push({ da: suggerimento.slice(0, 2), a: suggerimento.slice(2, 4), colore: COLORE_SEGNO.g });
  const evidenzia = Object.fromEntries(segni.flatMap((s) => ('casa' in s ? [[s.casa, COLORE_SEGNO[s.c]]] : [])));

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-3 md:p-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex gap-2">
        <BarraValutazione v={valutazione} orientamento={orient} />
        <div className="min-w-0 flex-1">
          <Scacchiera
            fen={attuale.fen}
            orientamento={orient}
            ultima={attuale.uci}
            frecce={frecce}
            evidenzia={evidenzia}
            onMossa={modo === 'gioco' && esito.stato === 'continua' && !pensa ? (u) => { void onMossa(u); return true; } : undefined}
            muove={modo === 'gioco' && esito.stato === 'continua' && !pensa ? finale.colore : null}
            id="finale"
          />
        </div>
      </div>

      <aside className="flex flex-col gap-3 rounded-lg bg-[#262421] p-3 text-sm text-[#c3c2c1]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-[#8b8987]">{finale.gruppo}</p>
            <h1 className="text-lg font-bold text-white">{finale.titolo}</h1>
          </div>
          <Link href="/scacchi/finali" className="shrink-0 hover:text-white">← Finali</Link>
        </div>
        <p className="rounded bg-[#3c3a37] p-2 font-semibold text-white">
          Giochi col {finale.colore === 'w' ? 'Bianco' : 'Nero'}. {OBIETTIVO[finale.obiettivo](finale.mosse)}
        </p>

        {modo === 'studio' ? (
          <>
            <p>{finale.spiegazione}</p>
            <ul className="list-disc space-y-1 pl-5">{finale.idee.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {[...new Set(segni.map((x) => x.c))].map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-5 rounded-sm" style={{ background: COLORE_SEGNO[c] }} />
                  {c === 'g' ? 'la tua mossa e le case chiave' : c === 'r' ? "l'avversario" : 'il piano'}
                </span>
              ))}
            </div>
            <button onClick={() => setModo('gioco')} className="rounded-lg bg-[#81b64c] py-3 text-lg font-bold text-white shadow-[0_4px_0_#45753c]">Gioca contro Stockfish</button>
          </>
        ) : (
          <>
            <div className={`rounded p-3 ${esito.stato === 'riuscito' ? 'bg-[#2f3a2a]' : esito.stato === 'fallito' ? 'bg-[#3a2a28]' : 'bg-[#3c3a37]'}`}>
              {esito.messaggio ? (
                <p className={`font-bold ${esito.stato === 'riuscito' ? 'text-[#a3d160]' : 'text-white'}`}>{esito.messaggio}</p>
              ) : (
                <p className="font-bold text-white">{pensa ? 'Stockfish sta pensando…' : 'Tocca a te.'}</p>
              )}
              <p className="mt-1 text-xs">Mosse: {mieMosse} / {finale.mosse}{aiuti ? ` · aiuti usati: ${aiuti}` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-1 text-xs">
              {storia.slice(1).map((p, i) => (
                <span key={i} className={i % 2 === 0 ? 'text-white' : 'text-[#8b8987]'}>{i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}{p.san}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={indietro} disabled={storia.length < 2 || pensa} className="rounded bg-[#3c3a37] py-2 hover:bg-[#484644] disabled:opacity-40">Indietro</button>
              <button onClick={aiuto} disabled={pensa || esito.stato !== 'continua'} className="rounded bg-[#3c3a37] py-2 hover:bg-[#484644] disabled:opacity-40">Aiuto</button>
              <button onClick={ricomincia} disabled={pensa} className="rounded bg-[#3c3a37] py-2 hover:bg-[#484644] disabled:opacity-40">Ricomincia</button>
            </div>
            <details className="rounded bg-[#3c3a37] p-2">
              <summary className="cursor-pointer font-semibold text-white">Idee chiave</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">{finale.idee.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </details>
          </>
        )}
        <p className="text-xs text-[#8b8987]">
          {progresso?.completato || migliore !== null ? `Completato · record ${migliore} mosse` : 'Non ancora completato'}
          {progresso ? ` · ${progresso.tentativi} tentativi` : ''}
        </p>
      </aside>
    </div>
  );
}
