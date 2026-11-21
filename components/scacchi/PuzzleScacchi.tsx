'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Chess } from 'chess.js';
import Scacchiera, { type Freccia } from './Scacchiera';
import { suonoMossa } from './suoni';
import type { Puzzle } from '@/lib/scacchi/puzzle';

type Riepilogo = { totali: number; da_fare: number; imparati: number; tentativi: number; risolti: number; temi: { tema: string; n: number }[] };

export default function PuzzleScacchi({ puzzle, riepilogo }: { puzzle: Puzzle[]; riepilogo: Riepilogo }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [stato, setStato] = useState<'gioca' | 'sbagliato' | 'risolto' | 'svelato'>('gioca');
  const [errori, setErrori] = useState(0);
  const [passo, setPasso] = useState(0); // mosse della linea mostrate dopo la soluzione
  const [aiuto, setAiuto] = useState(false);
  const [fatti, setFatti] = useState({ ok: 0, ko: 0 });
  const p = puzzle[i];

  if (!p) {
    return (
      <div className="mx-auto max-w-3xl p-5 text-sm text-[#c3c2c1]">
        <div className="rounded-lg bg-[#262421] p-6 text-center">
          <h1 className="text-xl font-bold text-white">{riepilogo.totali === 0 ? 'Ancora nessun puzzle' : 'Per oggi hai finito'}</h1>
          <p className="mt-2">
            {riepilogo.totali === 0
              ? 'I puzzle nascono dai tuoi errori nelle partite analizzate. Vai in Statistiche e premi "Analizza le ultime 100".'
              : `${fatti.ok + fatti.ko > 0 ? `Oggi: ${fatti.ok} risolti, ${fatti.ko} da rivedere. ` : ''}${riepilogo.totali} puzzle in tutto, ${riepilogo.imparati} imparati. Tornano quando è il momento di ripassarli.`}
          </p>
          <Link href="/scacchi/statistiche" className="mt-4 inline-block rounded bg-[#81b64c] px-4 py-2 font-bold text-white">Vai alle statistiche</Link>
        </div>
      </div>
    );
  }

  const chi = p.colore === 'w' ? 'Bianco' : 'Nero';
  const linea = (() => {
    const c = new Chess(p.fen);
    const out: { fen: string; uci: string }[] = [];
    for (const s of p.linea) {
      try {
        const m = c.move(s);
        out.push({ fen: c.fen(), uci: m.from + m.to });
      } catch {
        break;
      }
    }
    return out;
  })();
  const finito = stato === 'risolto' || stato === 'svelato';
  const fen = finito && passo > 0 ? linea[Math.min(passo, linea.length) - 1].fen : p.fen;
  const ultima = finito && passo > 0 ? linea[Math.min(passo, linea.length) - 1].uci : null;
  const frecce: Freccia[] = [];
  if (stato === 'svelato' && passo === 0) frecce.push({ da: p.soluzione.slice(0, 2), a: p.soluzione.slice(2, 4), colore: 'rgba(129,182,76,0.9)' });
  // Aiuto: tema e casa del pezzo da muovere.
  const evidenzia: Record<string, string> = aiuto && !finito ? { [p.soluzione.slice(0, 2)]: 'rgba(80,140,220,0.9)' } : {};

  async function registra(risolto: boolean) {
    setFatti((f) => (risolto ? { ...f, ok: f.ok + 1 } : { ...f, ko: f.ko + 1 }));
    await fetch('/api/scacchi/puzzle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, risolto }) });
  }

  function onMossa(uci: string) {
    if (finito) return false;
    const giusta = uci.slice(0, 4) === p.soluzione.slice(0, 4) && (uci[4] ?? '') === (p.soluzione[4] ?? '');
    if (giusta) {
      suonoMossa(p.soluzione_san);
      setStato('risolto');
      setPasso(1);
      void registra(errori === 0 && !aiuto);
      return true;
    }
    setErrori((e) => e + 1);
    setStato('sbagliato');
    return false;
  }

  function svela() {
    setStato('svelato');
    setPasso(0);
    void registra(false);
  }

  function prossimo() {
    setI((x) => x + 1);
    setStato('gioca');
    setErrori(0);
    setPasso(0);
    setAiuto(false);
    if (i + 1 >= puzzle.length) router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-3 md:p-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <Scacchiera fen={fen} orientamento={p.colore === 'w' ? 'white' : 'black'} ultima={ultima} frecce={frecce} evidenzia={evidenzia} onMossa={finito ? undefined : onMossa} muove={finito ? null : p.colore} id="puzzle" />
      </div>
      <aside className="flex flex-col gap-3 rounded-lg bg-[#262421] p-3 text-sm text-[#c3c2c1]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Puzzle dai tuoi errori</h1>
          <span className="text-xs">{i + 1} / {puzzle.length}</span>
        </div>
        <div className={`rounded p-3 ${stato === 'risolto' ? 'bg-[#2f3a2a]' : stato === 'sbagliato' ? 'bg-[#3a2a28]' : 'bg-[#3c3a37]'}`}>
          {stato === 'gioca' && <p className="text-base font-bold text-white">Tocca al {chi}: trova la mossa migliore.</p>}
          {stato === 'sbagliato' && <p className="font-bold text-white">Non è questa. Riprova{errori >= 2 ? ', oppure guarda la soluzione' : ''}.</p>}
          {stato === 'risolto' && <p className="text-base font-bold text-[#a3d160]">{errori === 0 && !aiuto ? 'Esatto, al primo colpo!' : 'Esatto.'} {p.soluzione_san}</p>}
          {stato === 'svelato' && <p className="font-bold text-white">La soluzione era {p.soluzione_san} (freccia verde).</p>}
          {finito && (
            <p className="mt-2">
              Nella partita avevi giocato <b className="text-[#ffa459]">{p.giocata_san}</b>, perdendo il {Math.round(p.perdita * 100)}% di probabilità di vittoria.
            </p>
          )}
        </div>
        {!finito && (
          <div className="flex gap-2">
            <button onClick={() => setAiuto(true)} disabled={aiuto} className="flex-1 rounded bg-[#3c3a37] py-2 hover:bg-[#484644] disabled:opacity-50">
              {aiuto ? `Tema: ${p.tema} · pezzo in blu` : 'Aiuto'}
            </button>
            <button onClick={svela} className="flex-1 rounded bg-[#3c3a37] py-2 hover:bg-[#484644]">Soluzione</button>
          </div>
        )}
        {finito && linea.length > 1 && (
          <div className="rounded bg-[#3c3a37] p-3">
            <p className="mb-2">Come continua:</p>
            <div className="flex flex-wrap gap-1">
              {p.linea.slice(0, linea.length).map((s, k) => (
                <button key={k} onClick={() => setPasso(k + 1)} className={`rounded px-1.5 py-0.5 ${passo === k + 1 ? 'bg-[#484644] text-white' : ''}`}>{s}</button>
              ))}
            </div>
          </div>
        )}
        {finito && (
          <div className="flex gap-2">
            <button onClick={prossimo} className="flex-1 rounded bg-[#81b64c] py-2 font-bold text-white">Prossimo</button>
            <Link href={`/scacchi/partita/${p.partita_id}`} className="flex-1 rounded bg-[#3c3a37] py-2 text-center hover:bg-[#484644]">Vedi la partita</Link>
          </div>
        )}
        <p className="text-xs text-[#8b8987]">
          {riepilogo.totali} puzzle in tutto, {riepilogo.da_fare} da fare oggi, {riepilogo.imparati} imparati.
          {riepilogo.temi.length > 0 && ` Temi: ${riepilogo.temi.map((t) => `${t.tema} ${t.n}`).join(', ')}.`}
        </p>
      </aside>
    </div>
  );
}
