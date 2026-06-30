'use client';

import { useMemo, useState } from 'react';

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

export default function StatisticheDashboard({
  preventivi,
  abbonamenti,
}: {
  preventivi: Preventivo[];
  abbonamenti: Abbonamento[];
}) {
  const [includiDaIncassare, setIncludiDaIncassare] = useState(false);

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

    const totaleIncassatoEffettivo = includiDaIncassare ? totalePagato + totaleNonPagato : totalePagato;

    const oggi = new Date();
    const annoFiscaleInizio = oggi.getMonth() >= 9 ? oggi.getFullYear() : oggi.getFullYear() - 1;
    const inizioAnnoFiscale = new Date(annoFiscaleInizio, 9, 1);
    let giorniLavorativiAnno = 0;
    const cursore = new Date(inizioAnnoFiscale);
    while (cursore <= oggi) {
      const giorno = cursore.getDay();
      if (giorno !== 0 && giorno !== 6) giorniLavorativiAnno++;
      cursore.setDate(cursore.getDate() + 1);
    }

    const guadagnoAlGiorno = giorniLavorativiAnno > 0 ? totaleIncassatoEffettivo / giorniLavorativiAnno : 0;
    const guadagnoAllOra = guadagnoAlGiorno / 8;

    const mesi = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(annoFiscaleInizio, 9 + i, 1);
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

    accettati.forEach((p) => {
      const d = new Date(p.accettato_at || p.created_at);
      const mAccettazione = mesi.find((m) => m.anno === d.getFullYear() && m.mese === d.getMonth());
      if (!mAccettazione) return;
      mAccettazione.contrattualizzato += Number(p.totale);
      mAccettazione.count++;
      if (p.tranches_stato && p.tranches_stato.length > 0) {
        p.tranches_stato.forEach((t: any) => {
          const importo = Number(p.totale) * t.percentuale / 100;
          if (t.pagato) {
            const dataPag = t.data_pagamento ? new Date(t.data_pagamento) : new Date(p.accettato_at || p.created_at);
            const mPag = mesi.find((m) => m.anno === dataPag.getFullYear() && m.mese === dataPag.getMonth());
            if (mPag) mPag.incassato += importo;
          } else if (includiDaIncassare) {
            // tranche non pagata: attribuita al mese di accettazione
            mAccettazione.incassato += importo;
          }
        });
      }
    });

    mesi.forEach((m) => {
      m.costoAbbonamenti = abbonamenti.reduce((s, ab) => s + costoMensileAbbonamento(ab, m.anno, m.mese), 0);
      m.netto = m.incassato - m.costoAbbonamenti;
    });

    const maxValore = Math.max(...mesi.map((m) => Math.max(m.incassato, m.costoAbbonamenti)), 1);
    const mesiTrascorsi = mesi.filter((m) => new Date(m.anno, m.mese, 1) <= oggi);
    const mesiConDati = mesi.filter((m) => m.incassato > 0);
    const mediaIncassatoMensile = mesiConDati.length > 0
      ? mesiConDati.reduce((s, m) => s + m.incassato, 0) / mesiConDati.length : 0;
    const mediaNettoMensile = mesiTrascorsi.length > 0
      ? mesiTrascorsi.reduce((s, m) => s + m.netto, 0) / mesiTrascorsi.length : 0;

    const meseCorrente = new Date();
    const costoAbbMensileCorrente = abbonamenti.reduce(
      (s, ab) => s + costoMensileAbbonamento(ab, meseCorrente.getFullYear(), meseCorrente.getMonth()), 0
    );

    return {
      accettati, totaleContrattualizzato, inviati, rifiutati,
      tassoAccettazione, totalePagato, totaleNonPagato, totaleIncassatoEffettivo,
      guadagnoAlGiorno, guadagnoAllOra, giorniLavorativiAnno,
      mesi, maxValore, mediaIncassatoMensile, mediaNettoMensile,
      costoAbbMensileCorrente,
    };
  }, [preventivi, abbonamenti, includiDaIncassare]);

  const fmt = (n: number) => `€${Math.round(n).toLocaleString('it-IT')}`;

  return (
    <div className="min-h-screen text-text">

      {/* Header */}
      <header className="border-b border-edge px-6 py-5 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Statistiche</h1>
        <button
          onClick={() => setIncludiDaIncassare((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            includiDaIncassare
              ? 'bg-accent/10 border-accent text-accent'
              : 'bg-surface2 border-edge text-muted hover:text-text hover:border-slate'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${includiDaIncassare ? 'bg-accent' : 'bg-dim'}`} />
          {includiDaIncassare ? 'Incluso da incassare' : 'Includi da incassare'}
        </button>
      </header>

      <div className="px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">

        {/* KPI riga 1 — numeri grandi stile Crextio */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'CONTRATTUALIZZATO', value: fmt(stats.totaleContrattualizzato), sub: `${stats.accettati.length} progetti`, color: 'text-text' },
            { label: 'INCASSATO',         value: fmt(stats.totaleIncassatoEffettivo), sub: includiDaIncassare ? 'pagato + da incassare' : 'tranches pagate', color: 'text-green-400' },
            { label: 'DA INCASSARE',      value: includiDaIncassare ? '—' : fmt(stats.totaleNonPagato), sub: includiDaIncassare ? 'incluso nel calcolo' : 'tranches in attesa', color: includiDaIncassare ? 'text-dim' : 'text-accent' },
            { label: 'TASSO ACCETTAZIONE',value: `${stats.tassoAccettazione}%`,      sub: `${stats.rifiutati} rifiutati · ${stats.inviati} in attesa`, color: 'text-text' },
          ].map((k) => (
            <div key={k.label} className="bg-surface border border-edge rounded-xl p-5">
              <p className="text-dim text-xs font-medium mb-3">{k.label}</p>
              <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-dim text-xs mt-2">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* KPI riga 2 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'MEDIA NETTO/MESE',   value: fmt(stats.mediaNettoMensile),  sub: 'incassato − abbonamenti', color: stats.mediaNettoMensile >= 0 ? 'text-text' : 'text-red-400' },
            { label: 'TARIFFA GIORNALIERA',value: stats.guadagnoAlGiorno > 0 ? fmt(stats.guadagnoAlGiorno) : '—', sub: `${stats.giorniLavorativiAnno} giorni lav.`, color: 'text-accent' },
            { label: 'TARIFFA ORARIA',     value: stats.guadagnoAllOra > 0 ? `€${Math.round(stats.guadagnoAllOra).toLocaleString('it-IT')}` : '—', sub: '8h/giorno', color: 'text-accent' },
          ].map((k) => (
            <div key={k.label} className="bg-surface border border-edge rounded-xl p-5">
              <p className="text-dim text-xs font-medium mb-3">{k.label}</p>
              <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-dim text-xs mt-2">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Grafico */}
        <div className="bg-surface border border-edge rounded-xl p-6">
          <p className="text-dim text-xs font-medium mb-4">INCASSATO VS ABBONAMENTI — ULTIMI 12 MESI</p>
          <div className="flex gap-4 mb-5 flex-wrap">
            {[
              { color: 'bg-green-400', label: 'Incassato' },
              { color: 'bg-accent', label: 'Abbonamenti' },
              { color: 'bg-muted', label: 'Netto' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                <span className="text-muted text-xs">{l.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-end gap-1">
            {stats.mesi.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {(m.incassato > 0 || m.costoAbbonamenti > 0) && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface2 border border-edge rounded-lg p-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {m.incassato > 0 && <p className="text-green-400">{fmt(m.incassato)} incassato</p>}
                    <p className="text-accent">{fmt(m.costoAbbonamenti)} abbonamenti</p>
                    <p className={m.netto >= 0 ? 'text-text font-medium' : 'text-red-400 font-medium'}>
                      {fmt(m.netto)} netto
                    </p>
                  </div>
                )}
                <div className="w-full flex items-end gap-0.5" style={{ height: '120px' }}>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="w-full rounded-t-sm bg-green-400 transition-all"
                      style={{ height: `${Math.max(m.incassato > 0 ? (m.incassato / stats.maxValore) * 120 : 2, m.incassato > 0 ? 4 : 2)}px` }} />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className="w-full rounded-t-sm bg-accent transition-all"
                      style={{ height: `${Math.max(m.costoAbbonamenti > 0 ? (m.costoAbbonamenti / stats.maxValore) * 120 : 2, 4)}px` }} />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <div className={`w-full rounded-t-sm transition-all ${m.netto >= 0 ? 'bg-muted' : 'bg-red-600'}`}
                      style={{ height: `${Math.max(Math.abs(m.netto) > 0 ? (Math.abs(m.netto) / stats.maxValore) * 120 : 2, 4)}px` }} />
                  </div>
                </div>
                <p className="text-dim text-xs">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-edge">
            <div className="text-center">
              <p className="text-dim text-xs mb-1">MEDIA INCASSATO</p>
              <p className="text-green-400 font-bold text-lg">{fmt(stats.mediaIncassatoMensile)}</p>
              <p className="text-dim text-xs mt-0.5">mesi con progetti</p>
            </div>
            <div className="text-center">
              <p className="text-dim text-xs mb-1">ABBONAMENTI CORRENTI</p>
              <p className="text-accent font-bold text-lg">{fmt(stats.costoAbbMensileCorrente)}</p>
              <p className="text-dim text-xs mt-0.5">questo mese</p>
            </div>
            <div className="text-center">
              <p className="text-dim text-xs mb-1">MEDIA NETTO</p>
              <p className={`font-bold text-lg ${stats.mediaNettoMensile >= 0 ? 'text-text' : 'text-red-400'}`}>
                {fmt(stats.mediaNettoMensile)}
              </p>
              <p className="text-dim text-xs mt-0.5">mesi trascorsi da ott.</p>
            </div>
          </div>
        </div>

        {/* Lista progetti */}
        <div className="bg-surface border border-edge rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-edge">
            <p className="text-dim text-xs font-medium">DETTAGLIO PROGETTI ACCETTATI</p>
          </div>
          {stats.accettati.length === 0 ? (
            <div className="px-6 py-10 text-center text-dim text-sm">Nessun progetto accettato</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {stats.accettati.map((p) => {
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
                  <div key={p.id} className="px-6 py-4 border-b border-edge/50 last:border-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-text text-sm font-semibold truncate">{p.oggetto}</p>
                        <p className="text-muted text-xs">{p.cliente_nome}</p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {durata !== null && <p className="text-blue-400 text-xs">{durata} giorni</p>}
                          {tariffa !== null && <p className="text-accent text-xs">{`€${Math.round(tariffa).toLocaleString('it-IT')}/g`}</p>}
                          {nonPagato > 0 && <p className="text-amber-400 text-xs">{`€${Math.round(nonPagato).toLocaleString('it-IT')} da incassare`}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-text text-sm font-bold">{`€${Number(p.totale).toLocaleString('it-IT')}`}</p>
                        {pagato > 0 && <p className="text-green-400 text-xs">{`€${Math.round(pagato).toLocaleString('it-IT')} incassati`}</p>}
                      </div>
                    </div>
                    {p.tranches_stato && p.tranches_stato.length > 0 && (
                      <div className="mt-2 h-1 bg-edge rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${percPagato}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
