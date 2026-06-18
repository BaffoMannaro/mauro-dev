'use client';

import { useMemo } from 'react';

interface Preventivo {
  id: number;
  oggetto: string;
  cliente_nome: string;
  totale: number;
  stato: string;
  created_at: string;
  accettato_at: string | null;
  lavoro_inizio: string | null;
  lavoro_fine: string | null;
  tranches_stato: { descrizione: string; percentuale: number; pagato: boolean }[] | null;
  meta?: any;
}

export default function StatisticheDashboard({ preventivi }: { preventivi: Preventivo[] }) {
  const stats = useMemo(() => {
    const accettati = preventivi.filter((p) => p.stato === 'accettato' || p.stato === 'archiviato');
    const totaleAccettato = accettati.reduce((acc, p) => acc + Number(p.totale), 0);
    const inviati = preventivi.filter((p) => p.stato === 'inviato').length;
    const rifiutati = preventivi.filter((p) => p.stato === 'rifiutato').length;
    const tassoAccettazione = preventivi.length > 0
      ? Math.round((accettati.length / preventivi.length) * 100)
      : 0;

    const totalePagato = accettati.reduce((acc, p) => {
      if (!p.tranches_stato) return acc;
      return acc + p.tranches_stato
        .filter((t) => t.pagato)
        .reduce((s, t) => s + Number(p.totale) * t.percentuale / 100, 0);
    }, 0);

    const totaleAtteso = accettati.reduce((acc, p) => {
      if (!p.tranches_stato) return acc + Number(p.totale);
      return acc + p.tranches_stato
        .filter((t) => !t.pagato)
        .reduce((s, t) => s + Number(p.totale) * t.percentuale / 100, 0);
    }, 0);

    // Andamento mensile ultimi 12 mesi
    const oggi = new Date();
    const mesi = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(oggi.getFullYear(), oggi.getMonth() - 11 + i, 1);
      return {
        label: d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        anno: d.getFullYear(),
        mese: d.getMonth(),
        totale: 0,
        count: 0,
      };
    });

    accettati.forEach((p) => {
      const d = new Date(p.accettato_at || p.created_at);
      const m = mesi.find((m) => m.anno === d.getFullYear() && m.mese === d.getMonth());
      if (m) { m.totale += Number(p.totale); m.count++; }
    });

    const maxMese = Math.max(...mesi.map((m) => m.totale), 1);

    return { accettati, totaleAccettato, inviati, rifiutati, tassoAccettazione, totalePagato, totaleAtteso, mesi, maxMese };
  }, [preventivi]);

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-white font-semibold text-lg">Statistiche</h1>
      </header>

      <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col gap-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Fatturato totale', value: `€${stats.totaleAccettato.toLocaleString('it-IT', { minimumFractionDigits: 0 })}`, sub: `${stats.accettati.length} progetti` },
            { label: 'Incassato', value: `€${Math.round(stats.totalePagato).toLocaleString('it-IT')}`, sub: 'tranches pagate', color: 'text-green-400' },
            { label: 'Da incassare', value: `€${Math.round(stats.totaleAtteso).toLocaleString('it-IT')}`, sub: 'tranches in attesa', color: 'text-amber-400' },
            { label: 'Tasso accettazione', value: `${stats.tassoAccettazione}%`, sub: `${stats.rifiutati} rifiutati · ${stats.inviati} in attesa` },
          ].map((k, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-xs font-mono mb-2">{k.label.toUpperCase()}</p>
              <p className={`text-2xl font-semibold ${k.color || 'text-white'}`}>{k.value}</p>
              <p className="text-zinc-500 text-xs mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Grafico andamento mensile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-500 text-xs font-mono mb-6">ANDAMENTO MENSILE — ULTIMI 12 MESI</p>
          <div className="flex items-end gap-2 h-48">
            {stats.mesi.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-zinc-500 text-xs">
                  {m.totale > 0 ? `€${Math.round(m.totale / 1000)}k` : ''}
                </p>
                <div className="w-full flex flex-col justify-end" style={{ height: '140px' }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${m.totale > 0 ? 'bg-white' : 'bg-zinc-800'}`}
                    style={{ height: `${Math.max((m.totale / stats.maxMese) * 140, m.totale > 0 ? 4 : 2)}px` }}
                  />
                </div>
                <p className="text-zinc-600 text-xs">{m.label}</p>
                {m.count > 0 && <p className="text-zinc-600 text-xs">{m.count}p</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Lista progetti accettati */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <p className="text-zinc-500 text-xs font-mono">PROGETTI ACCETTATI</p>
          </div>
          {stats.accettati.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-600 text-sm">Nessun progetto accettato</div>
          ) : (
            stats.accettati.map((p) => {
              const pagato = p.tranches_stato
                ? p.tranches_stato.filter((t) => t.pagato).reduce((s, t) => s + Number(p.totale) * t.percentuale / 100, 0)
                : 0;
              const durata = p.lavoro_inizio && p.lavoro_fine
                ? Math.round((new Date(p.lavoro_fine).getTime() - new Date(p.lavoro_inizio).getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <div key={p.id} className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.oggetto}</p>
                    <p className="text-zinc-400 text-xs">{p.cliente_nome}</p>
                    {durata !== null && (
                      <p className="text-zinc-600 text-xs mt-0.5">{durata} giorni di lavoro</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-white text-sm font-semibold">€{Number(p.totale).toLocaleString('it-IT')}</p>
                    {p.tranches_stato && (
                      <p className="text-xs text-green-400">€{Math.round(pagato).toLocaleString('it-IT')} incassati</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
