'use client';

import { useEffect, useRef } from 'react';
import { COLORI, SIMBOLI, cpEquivalente, formattaValutazione, probVittoria, type Classificazione, type Valutazione } from '@/lib/scacchi/classifica';

/** Barra verticale della valutazione (bianco in basso se orientamento bianco). */
export function BarraValutazione({ v, orientamento = 'white' }: { v: Valutazione | null; orientamento?: 'white' | 'black' }) {
  const p = v ? probVittoria(v) : 0.5;
  const bianco = Math.round(p * 1000) / 10;
  const testo = v ? formattaValutazione(v).replace('+', '') : '0.0';
  const vantaggioBianco = v ? cpEquivalente(v) >= 0 : true;
  const giu = orientamento === 'white';
  return (
    <div className="relative w-6 shrink-0 overflow-hidden rounded bg-[#403d39] text-[10px] font-bold" style={{ minHeight: 120 }}>
      <div
        className="absolute left-0 right-0 bg-white transition-all duration-500"
        style={giu ? { bottom: 0, height: `${bianco}%` } : { top: 0, height: `${bianco}%` }}
      />
      <span
        className={`absolute left-0 right-0 text-center ${vantaggioBianco ? 'text-[#403d39]' : 'text-white'}`}
        style={vantaggioBianco === giu ? { bottom: 4 } : { top: 4 }}
      >
        {testo}
      </span>
    </div>
  );
}

/** Grafico dell'andamento: area bianca = vantaggio Bianco. Click per saltare a una mossa. */
export function GraficoValutazione({
  valori,
  corrente,
  onSalta,
  classi,
}: {
  valori: Valutazione[];
  corrente: number;
  onSalta: (ply: number) => void;
  classi?: (Classificazione | null)[];
}) {
  const W = 600;
  const H = 90;
  const n = Math.max(valori.length - 1, 1);
  const y = (v: Valutazione) => H - probVittoria(v) * H;
  const punti = valori.map((v, i) => `${(i / n) * W},${y(v)}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-20 w-full cursor-pointer rounded bg-[#403d39]"
      preserveAspectRatio="none"
      onClick={(e) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        onSalta(Math.round(((e.clientX - r.left) / r.width) * n));
      }}
    >
      <polygon points={`0,${H} ${punti} ${W},${H}`} fill="#fff" />
      <line x1="0" x2={W} y1={H / 2} y2={H / 2} stroke="#888" strokeWidth="0.5" />
      {classi?.map((c, i) =>
        c === 'grave' || c === 'mancata' || c === 'errore' || c === 'brillante' || c === 'ottima' || c === 'imprecisione' ? (
          <circle key={i} cx={(i / n) * W} cy={y(valori[i])} r="3.5" fill={COLORI[c]} stroke="#262421" strokeWidth="1" />
        ) : null
      )}
      <line x1={(corrente / n) * W} x2={(corrente / n) * W} y1="0" y2={H} stroke="#81b64c" strokeWidth="2" />
    </svg>
  );
}

export type VoceMossa = { ply: number; san: string; classificazione?: Classificazione | null; commento?: boolean };

/** Lista mosse a due colonne; evidenzia la mossa corrente e la tiene in vista. */
export function ListaMosse({ mosse, corrente, onSalta }: { mosse: VoceMossa[]; corrente: number; onSalta: (ply: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[data-attiva="1"]')?.scrollIntoView({ block: 'nearest' });
  }, [corrente]);
  const righe: [VoceMossa, VoceMossa | undefined][] = [];
  for (let i = 0; i < mosse.length; i += 2) righe.push([mosse[i], mosse[i + 1]]);
  const cella = (m?: VoceMossa) =>
    m ? (
      <button
        data-attiva={m.ply === corrente ? '1' : '0'}
        onClick={() => onSalta(m.ply)}
        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-left font-semibold ${
          m.ply === corrente ? 'bg-[#484644] text-white' : 'text-[#c3c2c1] hover:bg-[#3c3a37]'
        }`}
      >
        {m.classificazione && SIMBOLI[m.classificazione] && (
          <span className="text-[11px] font-black" style={{ color: COLORI[m.classificazione] }}>
            {SIMBOLI[m.classificazione]}
          </span>
        )}
        <span>{m.san}</span>
        {m.commento && <span className="text-[10px] text-[#81b64c]">●</span>}
      </button>
    ) : (
      <span />
    );
  return (
    <div ref={ref} className="max-h-72 overflow-y-auto text-sm">
      {righe.map(([a, b], i) => (
        <div key={i} className={`grid grid-cols-[2.5rem_1fr_1fr] items-center px-2 py-0.5 ${i % 2 ? 'bg-[#2a2825]' : ''}`}>
          <span className="text-[#8b8987]">{i + 1}.</span>
          {cella(a)}
          {cella(b)}
        </div>
      ))}
    </div>
  );
}

/** Pulsanti di navigazione e frecce da tastiera. */
export function Navigazione({
  corrente,
  totale,
  onSalta,
  onGira,
  tastiera = true,
}: {
  corrente: number;
  totale: number;
  onSalta: (ply: number) => void;
  onGira?: () => void;
  /** false per una seconda copia dei pulsanti (es. su mobile): niente doppio ascolto delle frecce. */
  tastiera?: boolean;
}) {
  useEffect(() => {
    if (!tastiera) return;
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') onSalta(Math.max(0, corrente - 1));
      else if (e.key === 'ArrowRight') onSalta(Math.min(totale, corrente + 1));
      else if (e.key === 'ArrowUp') onSalta(0);
      else if (e.key === 'ArrowDown') onSalta(totale);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [corrente, totale, onSalta, tastiera]);
  const b = 'flex-1 rounded bg-[#3c3a37] py-2 text-lg text-[#c3c2c1] hover:bg-[#484644] disabled:opacity-40';
  return (
    <div className="flex gap-1">
      <button className={b} onClick={() => onSalta(0)} disabled={corrente === 0} aria-label="Inizio">⏮</button>
      <button className={b} onClick={() => onSalta(corrente - 1)} disabled={corrente === 0} aria-label="Indietro">◀</button>
      <button className={b} onClick={() => onSalta(corrente + 1)} disabled={corrente >= totale} aria-label="Avanti">▶</button>
      <button className={b} onClick={() => onSalta(totale)} disabled={corrente >= totale} aria-label="Fine">⏭</button>
      {onGira && <button className={b} onClick={onGira} aria-label="Gira scacchiera">⇅</button>}
    </div>
  );
}
