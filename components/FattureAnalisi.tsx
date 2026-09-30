'use client';

import { useMemo, useState } from 'react';
import type { FatturaSalvata } from './FattureDashboard';
import { calcolaAnalisi, SOGLIA_FORFETTARIO } from '@/lib/fattura/analisi';

// it-IT non raggruppa sotto le 10.000: raggruppo a mano
const fmt = (n: number) => `€${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export default function FattureAnalisi({ archivio }: { archivio: FatturaSalvata[] }) {
  const anni = useMemo(
    () => [...new Set(archivio.map((f) => f.anno))].sort((a, b) => b - a),
    [archivio]
  );
  const [annoScelto, setAnnoScelto] = useState<number | null>(null);
  const anno = annoScelto !== null && anni.includes(annoScelto) ? annoScelto : anni[0];

  const s = useMemo(() => calcolaAnalisi(archivio, anno), [archivio, anno]);
  const { delta } = s;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-dim text-xs font-medium">ANALISI</p>
        <div className="flex gap-1">
          {anni.map((a) => (
            <button
              key={a}
              onClick={() => setAnnoScelto(a)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                a === anno ? 'bg-accent text-on-accent' : 'text-muted hover:text-text hover:bg-surface2'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-edge rounded-xl p-5">
          <p className="text-dim text-xs font-medium mb-3">FATTURATO {anno}</p>
          <p className="text-3xl font-bold">{fmt(s.fatturato)}</p>
          <p className="text-dim text-xs mt-2">
            {delta !== null
              ? <><span className={delta >= 0 ? 'text-green-400' : 'text-red-400'}>{delta >= 0 ? '+' : ''}{delta}%</span> vs {anno - 1}</>
              : `di cui ${fmt(s.contributo)} rivalsa INPS`}
          </p>
        </div>
        <div className="bg-surface border border-edge rounded-xl p-5">
          <p className="text-dim text-xs font-medium mb-3">FATTURE EMESSE</p>
          <p className="text-3xl font-bold">{s.n}</p>
          <p className="text-dim text-xs mt-2">media {fmt(s.n ? s.fatturato / s.n : 0)} a fattura</p>
        </div>
        <div className="bg-surface border border-edge rounded-xl p-5">
          <p className="text-dim text-xs font-medium mb-3">DA INCASSARE</p>
          <p className={`text-3xl font-bold ${s.daIncassare > 0 ? '' : 'text-accent'}`}>{fmt(s.daIncassare)}</p>
          <p className="text-dim text-xs mt-2">{s.aperte ? `${s.aperte} fatture aperte` : 'tutto incassato'}</p>
        </div>
        <div className="bg-surface border border-edge rounded-xl p-5">
          <p className="text-dim text-xs font-medium mb-3">SOGLIA FORFETTARIO</p>
          <p className={`text-3xl font-bold ${s.soglia >= 90 ? 'text-red-400' : ''}`}>{Math.round(s.soglia)}%</p>
          <div className="h-1.5 bg-surface2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full ${s.soglia >= 90 ? 'bg-red-400' : 'bg-accent'}`}
              style={{ width: `${s.soglia}%` }}
            />
          </div>
          <p className="text-dim text-xs mt-2">
            {fmt(Math.max(0, SOGLIA_FORFETTARIO - s.fatturato))} residui su {fmt(SOGLIA_FORFETTARIO)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        {/* Andamento mensile */}
        <div className="bg-surface border border-edge rounded-xl p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-dim text-xs font-medium">FATTURATO MENSILE {anno}</p>
            <div className="flex gap-4">
              {[
                { color: 'bg-accent', label: 'Incassato' },
                { color: 'bg-muted', label: 'Da incassare' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                  <span className="text-muted text-xs">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-1.5">
            {s.mesi.map((m) => {
              const tot = m.pagato + m.aperto;
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {tot > 0 && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface2 border border-edge rounded-lg p-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <p className="text-text font-medium">{fmt(tot)} · {m.n} {m.n === 1 ? 'fattura' : 'fatture'}</p>
                      {m.aperto > 0 && <p className="text-muted">{fmt(m.aperto)} da incassare</p>}
                    </div>
                  )}
                  <div className="w-full flex flex-col justify-end" style={{ height: 120 }}>
                    {m.aperto > 0 && (
                      <div className="w-full bg-muted rounded-t-sm" style={{ height: (m.aperto / s.maxMese) * 120 }} />
                    )}
                    <div
                      className={`w-full bg-accent ${m.aperto > 0 ? '' : 'rounded-t-sm'} ${tot === 0 ? 'opacity-20' : ''}`}
                      style={{ height: tot === 0 ? 2 : (m.pagato / s.maxMese) * 120 }}
                    />
                  </div>
                  <p className="text-dim text-xs">{m.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clienti */}
        <div className="bg-surface border border-edge rounded-xl p-6">
          <p className="text-dim text-xs font-medium mb-4">CLIENTI {anno}</p>
          <div className="flex flex-col gap-3.5">
            {s.clienti.slice(0, 6).map((c) => (
              <div key={c.nome}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <p className="truncate">{c.nome}</p>
                  <p className="font-semibold shrink-0">{fmt(c.totale)}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${(c.totale / s.fatturato) * 100}%` }} />
                  </div>
                  <p className="text-dim text-xs w-16 text-right">{Math.round((c.totale / s.fatturato) * 100)}% · {c.n}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
