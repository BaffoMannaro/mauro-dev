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

interface Abbonamento {
  id: number;
  nome: string;
  cifra: number;
  cadenza: string;
  data_inizio: string;
  data_fine: string | null;
  attivo: boolean;
}

function costoMensileAbbonamento(ab: Abbonamento, anno: number, mese: number): number {
  const inizio = new Date(ab.data_inizio);
  const fine = ab.data_fine ? new Date(ab.data_fine) : null;
  const dataCorrente = new Date(anno, mese, 1);
  const dataFineCorrente = new Date(anno, mese + 1, 0);

  if (inizio > dataFineCorrente) return 0;
  if (fine && fine < dataCorrente) return 0;

  if (ab.cadenza === 'mensile') return Number(ab.cifra);
  if (ab.cadenza === 'annuale') return Number(ab.cifra) / 12;
  if (ab.cadenza === 'una tantum') {
    if (inizio.getFullYear() === anno && inizio.getMonth() === mese) return Number(ab.cifra);
  }
  return 0;
}

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) {
  const h = max > 0 ? Math.max((Math.abs(value) / max) * 120, value !== 0 ? 4 : 2) : 2;
  return (
    <div className="flex-1 flex flex-col justify-end" style={{ height: '120px' }}>
      {label && <p className="text-xs text-center mb-1" style={{ fontSize: '10px' }}>{label}</p>}
      <div className={`w-full rounded-t-sm transition-all ${color}`} style={{ height: `${h}px` }} />
    </div>
  );
}

export default function StatisticheDashboard({
  preventivi,
  abbonamenti,
}: {
  preventivi: Preventivo[];
  abbonamenti: Abbonamento[];
}) {
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
    // Anno fiscale: ottobre → settembre
    // Troviamo l'ottobre di inizio del periodo corrente
    const annoFiscaleInizio = oggi.getMonth() >= 9
      ? oggi.getFullYear()
      : oggi.getFullYear() - 1;
    const mesi = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(annoFiscaleInizio, 9 + i, 1); // 9 = ottobre
      return {
        label: d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        anno: d.getFullYear(),
        mese: d.getMonth(),
        contrattualizzato: 0,
        incassato: 0,
        costoAbbonamenti: 0,
        netto: 0,
        count: 0,
      };
    });

    // Popola incassato per mese
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
    });

    // Popola costo abbonamenti per mese
    mesi.forEach((m) => {
      m.costoAbbonamenti = abbonamenti.reduce((s, ab) => s + costoMensileAbbonamento(ab, m.anno, m.mese), 0);
      m.netto = m.incassato - m.costoAbbonamenti;
    });

    const maxValore = Math.max(...mesi.map((m) => Math.max(m.incassato, m.costoAbbonamenti)), 1);
    const mesiConDati = mesi.filter((m) => m.incassato > 0);
    const mediaIncassatoMensile = mesiConDati.length > 0
      ? mesiConDati.reduce((s, m) => s + m.incassato, 0) / mesiConDati.length : 0;
    const mediaNettoMensile = mesiConDati.length > 0
      ? mesiConDati.reduce((s, m) => s + m.netto, 0) / mesiConDati.length : 0;

    // Costo abbonamenti mensile totale attuale
    const meseCorrente = new Date();
    const costoAbbMensileCorrente = abbonamenti.reduce(
      (s, ab) => s + costoMensileAbbonamento(ab, meseCorrente.getFullYear(), meseCorrente.getMonth()), 0
    );

    return {
      accettati, totaleContrattualizzato, inviati, rifiutati,
      tassoAccettazione, totalePagato, totaleNonPagato,
      guadagnoAlGiorno, guadagnoAllOra,
      mesi, maxValore, mediaIncassatoMensile, mediaNettoMensile,
      costoAbbMensileCorrente,
    };
  }, [preventivi, abbonamenti]);

  const fmt = (n: number) => `€${Math.round(n).toLocaleString('it-IT')}`;

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
            <p className="text-white text-2xl font-semibold">{fmt(stats.totaleContrattualizzato)}</p>
            <p className="text-zinc-500 text-xs mt-1">{stats.accettati.length} progetti accettati</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">INCASSATO</p>
            <p className="text-green-400 text-2xl font-semibold">{fmt(stats.totalePagato)}</p>
            <p className="text-zinc-500 text-xs mt-1">tranches pagate</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">DA INCASSARE</p>
            <p className="text-amber-400 text-2xl font-semibold">{fmt(stats.totaleNonPagato)}</p>
            <p className="text-zinc-500 text-xs mt-1">tranches in attesa</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">TASSO ACCETTAZIONE</p>
            <p className="text-white text-2xl font-semibold">{stats.tassoAccettazione}%</p>
            <p className="text-zinc-500 text-xs mt-1">{stats.rifiutati} rifiutati · {stats.inviati} in attesa</p>
          </div>
        </div>

        {/* KPI riga 2 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">MEDIA NETTO/MESE</p>
            <p className={`text-2xl font-semibold ${stats.mediaNettoMensile >= 0 ? 'text-white' : 'text-red-400'}`}>
              {fmt(stats.mediaNettoMensile)}
            </p>
            <p className="text-zinc-500 text-xs mt-1">incassato - abbonamenti</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">TARIFFA GIORNALIERA</p>
            <p className="text-purple-400 text-2xl font-semibold">
              {stats.guadagnoAlGiorno > 0 ? fmt(stats.guadagnoAlGiorno) : '—'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">incassato ÷ giorni lavorati</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">TARIFFA ORARIA</p>
            <p className="text-pink-400 text-2xl font-semibold">
              {stats.guadagnoAllOra > 0 ? `€${Math.round(stats.guadagnoAllOra)}` : '—'}
            </p>
            <p className="text-zinc-500 text-xs mt-1">su base 8h/giorno</p>
          </div>
        </div>

        {/* Grafico incassato vs abbonamenti */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-500 text-xs font-mono mb-2">INCASSATO VS ABBONAMENTI — ULTIMI 12 MESI</p>
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-400"></div>
              <span className="text-zinc-400 text-xs">Incassato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500"></div>
              <span className="text-zinc-400 text-xs">Abbonamenti</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-zinc-400"></div>
              <span className="text-zinc-400 text-xs">Netto</span>
            </div>
          </div>

          <div className="flex items-end gap-1">
            {stats.mesi.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                {(m.incassato > 0 || m.costoAbbonamenti > 0) && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {m.incassato > 0 && <p className="text-green-400">{fmt(m.incassato)} incassato</p>}
                    <p className="text-red-400">{fmt(m.costoAbbonamenti)} abbonamenti</p>
                    <p className={m.netto >= 0 ? 'text-white font-medium' : 'text-red-400 font-medium'}>
                      {fmt(m.netto)} netto
                    </p>
                  </div>
                )}

                {/* Barre affiancate */}
                <div className="w-full flex items-end gap-0.5" style={{ height: '120px' }}>
                  {/* Incassato */}
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-green-400 transition-all"
                      style={{ height: `${Math.max(m.incassato > 0 ? (m.incassato / stats.maxValore) * 120 : 2, m.incassato > 0 ? 4 : 2)}px` }}
                    />
                  </div>
                  {/* Abbonamenti */}
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t-sm bg-red-500 transition-all"
                      style={{ height: `${Math.max(m.costoAbbonamenti > 0 ? (m.costoAbbonamenti / stats.maxValore) * 120 : 2, 4)}px` }}
                    />
                  </div>
                  {/* Netto */}
                  <div className="flex-1 flex flex-col justify-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${m.netto >= 0 ? 'bg-zinc-400' : 'bg-red-800'}`}
                      style={{ height: `${Math.max(Math.abs(m.netto) > 0 ? (Math.abs(m.netto) / stats.maxValore) * 120 : 2, 4)}px` }}
                    />
                  </div>
                </div>
                <p className="text-zinc-600 text-xs">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Riepilogo sotto grafico */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-800">
            <div className="text-center">
              <p className="text-zinc-500 text-xs font-mono mb-1">MEDIA INCASSATO</p>
              <p className="text-green-400 font-semibold">{fmt(stats.mediaIncassatoMensile)}</p>
              <p className="text-zinc-600 text-xs mt-0.5">mesi con progetti</p>
            </div>
            <div className="text-center">
              <p className="text-zinc-500 text-xs font-mono mb-1">ABBONAMENTI CORRENTI</p>
              <p className="text-red-400 font-semibold">{fmt(stats.costoAbbMensileCorrente)}</p>
              <p className="text-zinc-600 text-xs mt-0.5">questo mese</p>
            </div>
            <div className="text-center">
              <p className="text-zinc-500 text-xs font-mono mb-1">MEDIA NETTO</p>
              <p className={`font-semibold ${stats.mediaNettoMensile >= 0 ? 'text-white' : 'text-red-400'}`}>
                {fmt(stats.mediaNettoMensile)}
              </p>
              <p className="text-zinc-600 text-xs mt-0.5">mesi con progetti</p>
            </div>
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