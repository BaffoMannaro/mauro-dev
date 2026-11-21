'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Scacchiera, { type Freccia } from './Scacchiera';
import { Navigazione } from './Pannelli';
import { suonoMossa } from './suoni';
import { apertura } from '@/lib/scacchi/partita';
import type { Linea } from '@/lib/scacchi/repertorio';

type Modo = 'lezione' | 'drill';

/** Posizioni dopo ogni mossa della linea (indice 0 = iniziale). */
function posizioni(l: Linea) {
  const c = new Chess();
  const out = [{ fen: c.fen(), uci: null as string | null }];
  for (const [san] of l.mosse) {
    const m = c.move(san);
    out.push({ fen: c.fen(), uci: m.from + m.to + (m.promotion ?? '') });
  }
  return out;
}

export default function Lezione({ linea, livello }: { linea: Linea; livello: number }) {
  const pos = useMemo(() => posizioni(linea), [linea]);
  const [modo, setModo] = useState<Modo>('lezione');
  const [passo, setPasso] = useState(0);
  const [errori, setErrori] = useState(0);
  const [sbaglio, setSbaglio] = useState<string | null>(null);
  const [suggerisci, setSuggerisci] = useState(false);
  const [esito, setEsito] = useState<{ livello: number; giorni: number } | null>(null);
  const [liv, setLiv] = useState(livello);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totale = linea.mosse.length;
  const orient = linea.colore === 'w' ? 'white' : 'black';
  const turnoMio = (p: number) => (p % 2 === 0 ? 'w' : 'b') === linea.colore;

  const nome = useMemo(() => {
    for (let i = passo; i > 0; i--) {
      const a = apertura(pos[i].fen);
      if (a) return `${a.eco} ${a.nome}`;
    }
    return null;
  }, [passo, pos]);

  const finisci = useCallback(
    async (err: number) => {
      const r = await fetch('/api/scacchi/drill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linea: linea.id, errori: err }),
      }).then((x) => x.json());
      setEsito({ livello: r.livello, giorni: r.prossimo_tra_giorni });
      setLiv(r.livello);
    },
    [linea.id]
  );

  // Drill: le mosse dell'avversario si giocano da sole.
  useEffect(() => {
    if (modo !== 'drill' || esito || passo >= totale) return;
    if (!turnoMio(passo)) {
      timer.current = setTimeout(() => {
        suonoMossa(linea.mosse[passo][0]);
        setPasso(passo + 1);
        if (passo + 1 >= totale) void finisci(errori);
      }, 450);
      return () => {
        if (timer.current) clearTimeout(timer.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, passo, esito]);

  function avviaDrill() {
    setModo('drill');
    setPasso(0);
    setErrori(0);
    setSbaglio(null);
    setSuggerisci(false);
    setEsito(null);
  }

  function onMossaDrill(uci: string) {
    if (modo !== 'drill' || esito || passo >= totale || !turnoMio(passo)) return false;
    const c = new Chess(pos[passo].fen);
    let san: string;
    try {
      san = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
    } catch {
      return false;
    }
    const giusta = linea.mosse[passo][0];
    if (san === giusta) {
      suonoMossa(san);
      setSbaglio(null);
      setSuggerisci(false);
      setPasso(passo + 1);
      if (passo + 1 >= totale) void finisci(errori);
      return true;
    }
    setErrori((e) => e + 1);
    setSbaglio(san);
    setSuggerisci(true);
    return false;
  }

  const frecce: Freccia[] = [];
  if (modo === 'drill' && suggerisci && passo < totale) {
    const u = pos[passo + 1].uci!;
    frecce.push({ da: u.slice(0, 2), a: u.slice(2, 4), colore: 'rgba(150,190,70,.85)' });
  }
  if (modo === 'lezione' && passo < totale && turnoMio(passo)) {
    const u = pos[passo + 1].uci!;
    frecce.push({ da: u.slice(0, 2), a: u.slice(2, 4), colore: 'rgba(80,140,220,.6)' });
  }

  const corrente = passo > 0 ? linea.mosse[passo - 1] : null;
  const numero = (i: number) => `${Math.floor(i / 2) + 1}${i % 2 === 0 ? '.' : '...'}`;

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-3 md:p-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-2">
        <Scacchiera
          fen={pos[passo].fen}
          orientamento={orient}
          ultima={pos[passo].uci}
          frecce={frecce}
          onMossa={modo === 'drill' ? onMossaDrill : undefined}
          muove={modo === 'drill' && !esito && passo < totale && turnoMio(passo) ? linea.colore : null}
          id="lezione"
        />
        {nome && <p className="text-center text-xs text-[#8b8987]">{nome}</p>}
      </div>

      <aside className="flex flex-col gap-3 rounded-lg bg-[#262421] p-3 text-sm text-[#c3c2c1]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-[#8b8987]">{linea.gruppo}</p>
            <h1 className="text-lg font-bold text-white">{linea.titolo}</h1>
          </div>
          <Link href="/scacchi/aperture" className="shrink-0 hover:text-white">← Repertorio</Link>
        </div>
        <p className="rounded bg-[#3c3a37] p-2 text-xs">{linea.motivo}</p>

        <div className="flex gap-1">
          <button onClick={() => { setModo('lezione'); setPasso(0); setEsito(null); }} className={`flex-1 rounded py-2 font-semibold ${modo === 'lezione' ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37]'}`}>
            Lezione
          </button>
          <button onClick={avviaDrill} className={`flex-1 rounded py-2 font-semibold ${modo === 'drill' ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37]'}`}>
            Drill {liv > 0 ? `· livello ${liv}` : ''}
          </button>
        </div>

        {modo === 'lezione' ? (
          <>
            <div className="min-h-24 rounded bg-[#3c3a37] p-3">
              {corrente ? (
                <>
                  <p className="font-bold text-white">{numero(passo - 1)} {corrente[0]}</p>
                  <p className="mt-1">{corrente[1] || (turnoMio(passo - 1) ? '' : 'Mossa dell\'avversario.')}</p>
                </>
              ) : (
                <p>Segui la linea con ▶. La freccia blu indica la tua prossima mossa. Poi passa al Drill.</p>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {linea.mosse.map(([san, perche], i) => (
                <button
                  key={i}
                  onClick={() => setPasso(i + 1)}
                  className={`block w-full rounded px-2 py-1 text-left ${passo === i + 1 ? 'bg-[#484644] text-white' : 'hover:bg-[#3c3a37]'}`}
                >
                  <span className={`font-semibold ${turnoMio(i) ? 'text-[#81b64c]' : 'text-[#c3c2c1]'}`}>{numero(i)} {san}</span>
                  {perche && <span className="ml-2 text-xs text-[#8b8987]">{perche.length > 60 ? perche.slice(0, 60) + '…' : perche}</span>}
                </button>
              ))}
            </div>
            <Navigazione corrente={passo} totale={totale} onSalta={(p) => setPasso(Math.max(0, Math.min(totale, p)))} />
            {passo === totale && (
              <div className="rounded border-l-4 border-[#81b64c] bg-[#2f3a2a] p-3">
                <p className="mb-1 font-bold text-white">Piani per il mediogioco</p>
                <ul className="list-disc space-y-1 pl-4">{linea.piani.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="h-2 overflow-hidden rounded bg-[#3c3a37]">
              <div className="h-full bg-[#81b64c] transition-all" style={{ width: `${(passo / totale) * 100}%` }} />
            </div>
            {esito ? (
              <div className="rounded bg-[#3c3a37] p-3 text-center">
                <p className="text-lg font-bold text-white">{errori === 0 ? 'Perfetto!' : `${errori} ${errori === 1 ? 'errore' : 'errori'}`}</p>
                <p>
                  {errori === 0
                    ? esito.giorni > 0 ? `Livello ${esito.livello}. Prossimo ripasso tra ${esito.giorni} ${esito.giorni === 1 ? 'giorno' : 'giorni'}.` : `Livello ${esito.livello}.`
                    : 'Ripeti finché non fai un giro senza errori.'}
                </p>
                <button onClick={avviaDrill} className="mt-3 rounded bg-[#81b64c] px-4 py-2 font-bold text-white">Ripeti</button>
              </div>
            ) : sbaglio ? (
              <div className="rounded border-l-4 border-[#fa412d] bg-[#3a2a28] p-3">
                <p className="font-bold text-white">{sbaglio} non è la mossa del repertorio</p>
                <p className="mt-1">
                  La mossa giusta è <b className="text-white">{linea.mosse[passo][0]}</b> (freccia verde). {linea.mosse[passo][1]}
                </p>
              </div>
            ) : (
              <div className="rounded bg-[#3c3a37] p-3">
                {passo < totale && turnoMio(passo) ? (
                  <p><b className="text-white">Tocca a te.</b> Gioca la mossa del repertorio.</p>
                ) : (
                  <p>Mossa dell&apos;avversario…</p>
                )}
                {passo > 0 && linea.mosse[passo - 1][1] && <p className="mt-1 text-xs text-[#8b8987]">{numero(passo - 1)} {linea.mosse[passo - 1][0]}: {linea.mosse[passo - 1][1]}</p>}
              </div>
            )}
            <p className="text-xs text-[#8b8987]">Errori in questo giro: {errori}</p>
          </div>
        )}
      </aside>
    </div>
  );
}
