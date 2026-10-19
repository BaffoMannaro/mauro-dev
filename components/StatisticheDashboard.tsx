'use client';

import { useMemo, useState } from 'react';
import { euro as fmt } from '@/lib/formato';
import { accettato, calcolaIncassi, type FatturaIncasso } from '@/lib/incassi';
import type { ImpostazioniFisco } from '@/lib/fisco';
import FiscoPannello from './FiscoPannello';

interface Tranche {
  descrizione: string;
  percentuale: number;
  pagato: boolean;
  data_pagamento?: string | null;
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
  fatture,
  fisco,
}: {
  preventivi: Preventivo[];
  abbonamenti: Abbonamento[];
  fatture: FatturaIncasso[];
  fisco: ImpostazioniFisco;
}) {
  const [includiDaIncassare, setIncludiDaIncassare] = useState(false);

  const stats = useMemo(() => {
    const accettati = preventivi.filter(accettato);
    const totaleContrattualizzato = accettati.reduce((acc, p) => acc + Number(p.totale), 0);
    const inviati = preventivi.filter((p) => p.stato === 'inviato').length;
    const rifiutati = preventivi.filter((p) => p.stato === 'rifiutato').length;
    const tassoAccettazione = preventivi.length > 0
      ? Math.round((accettati.length / preventivi.length) * 100) : 0;

    // Incassato: fatture pagate e tranche spuntate (vedi lib/incassi.ts).
    const { incassi, perPreventivo } = calcolaIncassi(preventivi, fatture);
    const totalePagato = incassi.reduce((s, x) => s + x.importo, 0);
    const residuo = (p: Preventivo) => Math.max(0, Number(p.totale) - (perPreventivo.get(p.id) ?? 0));
    const totaleNonPagato = accettati.reduce((s, p) => s + residuo(p), 0);

    // Ultimi 12 mesi, dal mese di un anno fa a quello in corso.
    const oggi = new Date();
    const mesi = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(oggi.getFullYear(), oggi.getMonth() - 11 + i, 1);
      return {
        label: d.toLocaleDateString('it-IT', { month: 'short' }),
        anno: d.getFullYear(),
        mese: d.getMonth(),
        incassato: 0,
        costoAbbonamenti: 0,
        netto: 0,
      };
    });
    const meseDi = (iso: string) => {
      const [a, m] = iso.slice(0, 7).split('-').map(Number);
      return mesi.find((x) => x.anno === a && x.mese === m - 1);
    };

    incassi.forEach((x) => {
      const m = meseDi(x.data);
      if (m) m.incassato += x.importo;
    });
    if (includiDaIncassare) {
      // Quello che resta da incassare va nel mese di accettazione del preventivo.
      accettati.forEach((p) => {
        const m = meseDi(new Date(p.accettato_at || p.created_at).toISOString());
        if (m) m.incassato += residuo(p);
      });
    }

    mesi.forEach((m) => {
      m.costoAbbonamenti = abbonamenti.reduce((s, ab) => s + costoMensileAbbonamento(ab, m.anno, m.mese), 0);
      m.netto = m.incassato - m.costoAbbonamenti;
    });

    // Tariffe: incassato degli ultimi 12 mesi diviso i giorni lavorativi dello stesso periodo.
    const incassatoPeriodo = mesi.reduce((s, m) => s + m.incassato, 0);
    let giorniLavorativiAnno = 0;
    const cursore = new Date(mesi[0].anno, mesi[0].mese, 1);
    while (cursore <= oggi) {
      const giorno = cursore.getDay();
      if (giorno !== 0 && giorno !== 6) giorniLavorativiAnno++;
      cursore.setDate(cursore.getDate() + 1);
    }
    const guadagnoAlGiorno = giorniLavorativiAnno > 0 ? incassatoPeriodo / giorniLavorativiAnno : 0;
    const guadagnoAllOra = guadagnoAlGiorno / 8;
    const totaleIncassatoEffettivo = includiDaIncassare ? totalePagato + totaleNonPagato : totalePagato;

    const maxValore = Math.max(...mesi.map((m) => Math.max(m.incassato, m.costoAbbonamenti, Math.abs(m.netto))), 1);
    const mesiConDati = mesi.filter((m) => m.incassato > 0);
    const mediaIncassatoMensile = mesiConDati.length > 0
      ? mesiConDati.reduce((s, m) => s + m.incassato, 0) / mesiConDati.length : 0;
    const mediaNettoMensile = mesi.reduce((s, m) => s + m.netto, 0) / mesi.length;

    const costoAbbMensileCorrente = abbonamenti.reduce(
      (s, ab) => s + costoMensileAbbonamento(ab, oggi.getFullYear(), oggi.getMonth()), 0
    );

    return {
      accettati, totaleContrattualizzato, inviati, rifiutati,
      tassoAccettazione, totalePagato, totaleNonPagato, totaleIncassatoEffettivo,
      guadagnoAlGiorno, guadagnoAllOra, giorniLavorativiAnno, perPreventivo,
      mesi, maxValore, mediaIncassatoMensile, mediaNettoMensile,
      costoAbbMensileCorrente,
    };
  }, [preventivi, abbonamenti, fatture, includiDaIncassare]);

  return (
    <div className="min-h-screen text-text">

      {/* Header */}
      <header className="testata">
        <h1 className="titolo-pagina">Statistiche</h1>
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

      <div className="corpo max-w-6xl">

        {/* KPI riga 1 — numeri grandi stile Crextio */}
        <div className="kpi-griglia md:grid-cols-4">
          {[
            { label: 'CONTRATTUALIZZATO', value: fmt(stats.totaleContrattualizzato), sub: `${stats.accettati.length} progetti`, color: 'text-text' },
            { label: 'INCASSATO',         value: fmt(stats.totaleIncassatoEffettivo), sub: includiDaIncassare ? 'pagato + da incassare' : 'fatture pagate e tranche', color: 'text-green-400' },
            { label: 'DA INCASSARE',      value: includiDaIncassare ? '—' : fmt(stats.totaleNonPagato), sub: includiDaIncassare ? 'incluso nel calcolo' : 'residuo dei lavori accettati', color: includiDaIncassare ? 'text-dim' : 'text-accent' },
            { label: 'TASSO ACCETTAZIONE',value: `${stats.tassoAccettazione}%`,      sub: `${stats.rifiutati} rifiutati · ${stats.inviati} in attesa`, color: 'text-text' },
          ].map((k) => (
            <div key={k.label} className="kpi">
              <p className="kpi-etichetta">{k.label}</p>
              <p className={`kpi-valore ${k.color}`}>{k.value}</p>
              <p className="kpi-nota">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* KPI riga 2 */}
        <div className="kpi-griglia sm:grid-cols-3">
          {[
            { label: 'MEDIA NETTO/MESE',   value: fmt(stats.mediaNettoMensile),  sub: 'incassato − abbonamenti', color: stats.mediaNettoMensile >= 0 ? 'text-text' : 'text-red-400' },
            { label: 'TARIFFA GIORNALIERA',value: stats.guadagnoAlGiorno > 0 ? fmt(stats.guadagnoAlGiorno) : '—', sub: `${stats.giorniLavorativiAnno} giorni lav. in 12 mesi`, color: 'text-accent' },
            { label: 'TARIFFA ORARIA',     value: stats.guadagnoAllOra > 0 ? fmt(stats.guadagnoAllOra) : '—', sub: '8h/giorno', color: 'text-accent' },
          ].map((k) => (
            <div key={k.label} className="kpi">
              <p className="kpi-etichetta">{k.label}</p>
              <p className={`kpi-valore ${k.color}`}>{k.value}</p>
              <p className="kpi-nota">{k.sub}</p>
            </div>
          ))}
        </div>

        <FiscoPannello fatture={fatture} impostazioni={fisco} />

        {/* Grafico */}
        <div className="scheda">
          <p className="text-dim text-xs font-medium mb-4">INCASSATO VS ABBONAMENTI · ULTIMI 12 MESI</p>
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

          <div className="flex items-end gap-1 sm:gap-1.5">
            {stats.mesi.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {(m.incassato > 0 || m.costoAbbonamenti > 0) && (
                  <div className={`absolute bottom-full mb-2 ${i < 3 ? 'left-0' : i > 8 ? 'right-0' : 'left-1/2 -translate-x-1/2'} bg-surface2 border border-edge rounded-lg p-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none`}>
                    {m.incassato > 0 && <p className="text-green-400">{fmt(m.incassato)} incassato</p>}
                    <p className="text-accent">{fmt(m.costoAbbonamenti)} abbonamenti</p>
                    <p className={m.netto >= 0 ? 'text-text font-medium' : 'text-red-400 font-medium'}>
                      {fmt(m.netto)} netto
                    </p>
                  </div>
                )}
                <div className="w-full flex items-end gap-px sm:gap-0.5" style={{ height: '120px' }}>
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
                <p className="text-dim text-[10px] sm:text-xs whitespace-nowrap">{m.label}<span className="hidden sm:inline"> {String(m.anno).slice(2)}</span></p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-5 pt-4 sm:mt-6 sm:pt-5 border-t border-edge">
            <div className="text-center">
              <p className="text-dim text-[11px] sm:text-xs leading-snug mb-1">MEDIA INCASSATO</p>
              <p className="text-green-400 font-bold text-base sm:text-lg tabular-nums">{fmt(stats.mediaIncassatoMensile)}</p>
              <p className="text-dim text-xs mt-0.5">mesi con progetti</p>
            </div>
            <div className="text-center">
              <p className="text-dim text-[11px] sm:text-xs leading-snug mb-1">ABBONAMENTI CORRENTI</p>
              <p className="text-accent font-bold text-base sm:text-lg tabular-nums">{fmt(stats.costoAbbMensileCorrente)}</p>
              <p className="text-dim text-xs mt-0.5">questo mese</p>
            </div>
            <div className="text-center">
              <p className="text-dim text-[11px] sm:text-xs leading-snug mb-1">MEDIA NETTO</p>
              <p className={`font-bold text-base sm:text-lg tabular-nums ${stats.mediaNettoMensile >= 0 ? 'text-text' : 'text-red-400'}`}>
                {fmt(stats.mediaNettoMensile)}
              </p>
              <p className="text-dim text-xs mt-0.5">ultimi 12 mesi</p>
            </div>
          </div>
        </div>

        {/* Lista progetti */}
        <div className="bg-surface border border-edge rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-edge">
            <p className="text-dim text-xs font-medium">DETTAGLIO PROGETTI ACCETTATI</p>
          </div>
          {stats.accettati.length === 0 ? (
            <div className="px-4 sm:px-5 py-10 text-center text-dim text-sm">Nessun progetto accettato</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {stats.accettati.map((p) => {
                const pagato = stats.perPreventivo.get(p.id) ?? 0;
                const nonPagato = Math.max(0, Number(p.totale) - pagato);
                const durata = p.lavoro_inizio && p.lavoro_fine
                  ? Math.round((new Date(p.lavoro_fine).getTime() - new Date(p.lavoro_inizio).getTime()) / (1000 * 60 * 60 * 24)) + 1 // inizio e fine inclusi
                  : null;
                const tariffa = durata && durata > 0 ? pagato / durata : null;
                const percPagato = Math.min(100, Math.round((pagato / (Number(p.totale) || 1)) * 100));

                return (
                  <div key={p.id} className="px-4 sm:px-5 py-4 border-b border-edge/50 last:border-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-text text-sm font-semibold truncate">{p.oggetto}</p>
                        <p className="text-muted text-xs">{p.cliente_nome}</p>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {durata !== null && <p className="text-blue-400 text-xs">{durata} {durata === 1 ? 'giorno' : 'giorni'}</p>}
                          {tariffa !== null && <p className="text-accent text-xs">{`${fmt(tariffa)}/g`}</p>}
                          {nonPagato > 0 && <p className="text-amber-400 text-xs">{`${fmt(nonPagato)} da incassare`}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-text text-sm font-bold">{fmt(Number(p.totale))}</p>
                        {pagato > 0 && <p className="text-green-400 text-xs">{`${fmt(pagato)} incassati`}</p>}
                      </div>
                    </div>
                    {pagato > 0 && (
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
