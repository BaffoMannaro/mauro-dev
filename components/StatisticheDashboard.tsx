'use client';

import { useMemo } from 'react';

interface Tranche {
  descrizione: string;
  percentuale: number;
  pagato: boolean;
}

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
  tranches_stato: Tranche[] | null;
  meta?: any;
}

function Bar({ value, max, color = 'bg-white', label, sub }: {
  value: number; max: number; color?: string; label?: string; sub?: string;
}) {
  const h = max > 0 ? Math.max((value / max) * 140, value > 0 ? 4 : 2) : 2;
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <p className="text-zinc-500 text-xs h-4">{label || ''}</p>
      <div className="w-full flex flex-col justify-end" style={{ height: '140px' }}>
        <div
          className={`w-full rounded-t-md transition-all ${value > 0 ? color : 'bg-zinc-800'}`}
          style={{ height: `${h}px` }}
        />
      </div>
      <p className="text-zinc-600 text-xs text-center">{sub || ''}</p>
    </div>
  );
}

function kpiValue(raw: string) {
  return raw;
}

export default function StatisticheDashboard({ preventivi }: { preventivi: Preventivo[] }) {
  const stats = useMemo(() => {
    const accettati = preventivi.filter((p) => p.stato === 'accettato' || p.stato === 'archiviato');
    const totaleContrattualizzato = accettati.reduce((acc, p) => acc + Number(p.totale), 0);
    const inviati = preventivi.filter((p) => p.stato === 'inviato').length;
    const rifiutati = preventivi.filter((p) => p.stato === 'rifiutato').length;
    const tassoAccettazione = preventivi.length > 0
      ? Math.round((accettati.length / preventivi.length) * 100) : 0;

    const totalePagato = accettati.reduce((acc, p) => {
      if (!p.tranches_stato || p.tranches_stato.length === 0) return acc;
      return acc + p.tranches_stato
        .filter((t) => t.pagato)
        .reduce((s, t) => s + Number(p.totale) * t.percentuale / 100, 0);
    }, 0);

    const totaleNonPagato = accettati.reduce((acc, p) => {
      if (!p.tranches_stato || p.tranches_stato.length === 0) return acc + Number(p.totale);
      return acc + p.tranches_stato
        .filter((t) => !t.pagato)
        .reduce((s, t) => s + Number(p.totale) * t.percentuale / 100, 0);
    }, 0);

    const giorniLavoratiTotali = accettati.reduce((acc, p) => {
      if (!p.lavoro_inizio || !p.lavoro_fine) return acc;
      const diff = Math.round(
        (new Date(p.lavoro_fine).getTime() - new Date(p.lavoro_inizio).getTime()) / (1000 * 60 * 60 * 24)
      );
      return acc + Math.max(diff, 0);
    }, 0);

    const guadagnoAlGiorno = giorniLavoratiTotali > 0 ? totalePagato / giorniLavoratiTotali : 0;
    const guadagnoAllOra = guadagnoAlGiorno / 8;

    const oggi = new Date();
    const mesi = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(oggi.getFullYear(), oggi.getMonth() - 11 + i, 1);
      return {
        label: d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        anno: d.getFullYear(),
        mese: d.getMonth(),
        contrattualizzato: 0,
        incassato: 0,
        giorni: 0,
        count: 0,
      };
    });

    accettati.forEach((p) => {
      const d = new Date(p.accettato_at || p.created_at);
      const m = mesi.find((m) => m.anno === d.getFullYear() && m.mese === d.getMonth());
      if (!m) return;
      m.contrattualizzato += Number(p.totale);
      m.count++;
      if (p.tranches_stato && p.tranches_stato.length > 0) {
        m.incassato += p.tranches_stato
          .filter((t) => t.pagato)
          .reduce((s, t) => s + Number(p.totale) * t.percentuale / 100, 0);
      }
      if (p.lavoro_inizio && p.lavoro_fine) {
        const diff = Math.round(
          (new Date(p.lavoro_fine).getTime() - new Date(p.lavoro_inizio).getTime()) / (1000 * 60 * 60 * 24)
        );
        m.giorni += Math.max(diff, 0);
      }
    });

    const maxContrattualizzato = Math.max(...mesi.map((m) => m.contrattualizzato), 1);
    const maxGiorni = Math.max(...mesi.map((m) => m.giorni), 1);
    const mesiConDati = mesi.filter((m) => m.incassato > 0);
    const mediaIncassatoMensile = mesiConDati.length > 0
      ? mesiConDati.reduce((s, m) => s + m.incassato, 0) / mesiConDati.length : 0;

    return {
      accettati, totaleContrattualizzato, inviati, rifiutati,
      tassoAccettazione, totalePagato, totaleNonPagato,
      giorniLavoratiTotali, guadagnoAlGiorno, guadagnoAllOra,
      mesi, maxContrattualizzato, maxGiorni, mediaIncassatoMensile,
    };
  }, [preventivi]);

  const fmt = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 0 });

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-white font-semibold text-lg">Statistiche</h1>
      </header>
      <div className="px-6 py-8 max-w-5xl mx-auto flex flex-col gap-8">

        {/* KPI riga 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">CONTRATTUALIZZATO</p>
            <p className="text-white text-2xl font-semibold">{`€${fmt(stats.totaleContrattualizzato)}`}</p>
            <p className="text-zinc-500 text-xs mt-1">{stats.accettati.length} progetti accettati</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">INCASSATO</p>
            <p className="text-green-400 text-2xl font-semibold">{`€${fmt(Math.round(stats.totalePagato))}`}</p>
            <p className="text-zinc-500 text-xs mt-1">tranches pagate</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">DA INCASSARE</p>
            <p className="text-amber-400 text-2xl font-semibold">{`€${fmt(Math.round(stats.totaleNonPagato))}`}</p>
            <p className="text-zinc-500 text-xs mt-1">tranches in attesa</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">TASSO ACCETTAZIONE</p>
            <p className="text-white text-2xl font-semibold">{stats.tassoAccettazione}%</p>
            <p className="text-zinc-500 text-xs mt-1">{stats.rifiutati} rifiutati · {stats.inviati} in attesa</p>
          </div>
        </div>

        {/* KPI riga 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">GIORNI LAVORATI</p>
            <p className="text-blue-400 text-2xl font-semibold">{stats.giorniLavoratiTotali}g</p>
            <p className="text-zinc-500 text-xs mt-1">giorni tracciati</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">MEDIA MENSILE</p>
            <p className="text-white text-2xl font-semibold">{`€${fmt(Math.round(stats.mediaIncassatoMensile))}`}</p>
            <p className="text-zinc-500 text-xs mt-1">incassato/mese</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">TARIFFA GIORNALIERA</p>
            <p className="text-purple-400 text-2xl font-semibold">
              {stats.guadagnoAlGiorno > 0 ? `€${fmt(Math.round(stats.guadagnoAlGiorno))}` : '—'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">incassato diviso giorni</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">TARIFFA ORARIA</p>
            <p className="text-pink-400 text-2xl font-semibold">
              {stats.guadagnoAllOra > 0 ? `€${Math.round(stats.guadagnoAllOra)}` : '—'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">su base 8h/giorno</p>
          </div>
        </div>

        {/* Grafico contrattualizzato vs incassato */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-500 text-xs font-mono mb-2">CONTRATTUALIZZATO VS INCASSATO — ULTIMI 12 MESI</p>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-zinc-600"></div>
              <span className="text-zinc-400 text-xs">Contrattualizzato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-400"></div>
              <span className="text-zinc-400 text-xs">Incassato</span>
            </div>
          </div>
          <div className="flex items-end gap-1">
            {stats.mesi.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-0.5" style={{ height: '140px' }}>
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-zinc-600 transition-all"
                      style={{ height: `${Math.max(m.contrattualizzato > 0 ? (m.contrattualizzato / stats.maxContrattualizzato) * 140 : 2, m.contrattualizzato > 0 ? 4 : 2)}px` }}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-green-400 transition-all"
                      style={{ height: `${Math.max(m.incassato > 0 ? (m.incassato / stats.maxContrattualizzato) * 140 : 2, m.incassato > 0 ? 4 : 2)}px` }}
                    />
                  </div>
                </div>
                <p className="text-zinc-600 text-xs">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Grafico giorni lavorati */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-500 text-xs font-mono mb-6">GIORNI LAVORATI — ULTIMI 12 MESI</p>
          <div className="flex items-end gap-2">
            {stats.mesi.map((m, i) => (
              <Bar
                key={i}
                value={m.giorni}
                max={stats.maxGiorni}
                color="bg-blue-400"
                label={m.giorni > 0 ? `${m.giorni}g` : ''}
                sub={m.label}
              />
            ))}
          </div>
        </div>

        {/* Lista progetti */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <p className="text-zinc-500 text-xs font-mono">DETTAGLIO PROGETTI ACCETTATI</p>
          </div>
          {stats.accettati.length === 0 ? (
            <div className="px-6 py-8 text-center text-zinc-600 text-sm">Nessun progetto accettato</div>
          ) : (
            stats.accettati.map((p) => {
              const pagato = p.tranches_stato && p.tranches_stato.length > 0
                ? p.tranches_stato.filter((t) => t.pagato).reduce((s, t) => s + Number(p.totale) * t.percentuale / 100, 0)
                : 0;
              const nonPagato = Number(p.totale) - pagato;
              const durata = p.lavoro_inizio && p.lavoro_fine
                ? Math.round((new Date(p.lavoro_fine).getTime() - new Date(p.lavoro_inizio).getTime()) / (1000 * 60 * 60 * 24))
                : null;
              const tariffa = durata && durata > 0 ? pagato / durata : null;
              const percPagato = Math.round((pagato / Number(p.totale)) * 100);

              return (
                <div key={p.id} className="px-6 py-4 border-b border-zinc-800/50 last:border-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{p.oggetto}</p>
                      <p className="text-zinc-400 text-xs">{p.cliente_nome}</p>
                      <div className="flex gap-4 mt-1 flex-wrap">
                        {durata !== null && <p className="text-blue-400 text-xs">{durata} giorni</p>}
                        {tariffa !== null && <p className="text-purple-400 text-xs">{`€${Math.round(tariffa).toLocaleString('it-IT')}/giorno`}</p>}
                        {nonPagato > 0 && <p className="text-amber-400 text-xs">{`€${Math.round(nonPagato).toLocaleString('it-IT')} da incassare`}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white text-sm font-semibold">{`€${Number(p.totale).toLocaleString('it-IT')}`}</p>
                      {pagato > 0 && <p className="text-green-400 text-xs">{`€${Math.round(pagato).toLocaleString('it-IT')} incassati`}</p>}
                    </div>
                  </div>
                  {p.tranches_stato && p.tranches_stato.length > 0 && (
                    <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-400 rounded-full transition-all"
                        style={{ width: `${percPagato}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}