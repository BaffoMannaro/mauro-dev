'use client';

import { useMemo, useState } from 'react';
import { euro as fmt } from '@/lib/formato';
import type { FatturaIncasso } from '@/lib/incassi';
import type { ImpostazioniFisco } from '@/lib/fisco';
import { anniDisponibili, calcolaPeriodo, type AbbonamentoStat, type PreventivoStat } from '@/lib/statistiche';
import FiscoPannello from './FiscoPannello';

type Tab = number | 'totale';

const LEGENDA = [
  { color: 'bg-green-400', label: 'Incassato' },
  { color: 'bg-amber-400', label: 'Tasse e INPS' },
  { color: 'bg-accent', label: 'Abbonamenti' },
  { color: 'bg-muted', label: 'Netto' },
];

export default function StatisticheDashboard({
  preventivi,
  abbonamenti,
  fatture,
  fisco,
}: {
  preventivi: PreventivoStat[];
  abbonamenti: AbbonamentoStat[];
  fatture: FatturaIncasso[];
  fisco: ImpostazioniFisco;
}) {
  const dati = useMemo(() => ({ preventivi, fatture, abbonamenti, impostazioni: fisco }), [preventivi, fatture, abbonamenti, fisco]);
  const anni = useMemo(() => anniDisponibili(dati), [dati]);
  const corrente = new Date().getFullYear();
  const [tab, setTab] = useState<Tab>(corrente);
  const s = useMemo(() => calcolaPeriodo(tab, dati), [tab, dati]);

  const titolo = tab === 'totale' ? 'TOTALE' : String(tab);
  const quota = (n: number) => (s.incassato > 0 ? `${((n / s.incassato) * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%` : '—');
  const maxBarra = Math.max(...s.barre.map((b) => Math.max(b.incassato, b.tasse, b.abbonamenti, Math.abs(b.netto))), 1);
  const altezza = (v: number) => Math.max(v > 0 ? (v / maxBarra) * 120 : 2, v > 0 ? 3 : 2);
  const annoInCorso = tab === corrente;

  return (
    <div className="min-h-screen text-text">
      <header className="testata">
        <h1 className="titolo-pagina">Statistiche</h1>
        <div role="tablist" aria-label="Periodo" className="flex gap-1 overflow-x-auto scrollbar-nascosta max-sm:w-full">
          {(['totale', ...anni] as Tab[]).map((t) => (
            <button
              key={String(t)}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tab === t ? 'bg-accent text-on-accent' : 'text-muted hover:text-text hover:bg-surface2'
              }`}
            >
              {t === 'totale' ? 'Totale' : t}
            </button>
          ))}
        </div>
      </header>

      <div className="corpo max-w-6xl">
        {/* Dal lordo al netto */}
        <div className="kpi-griglia md:grid-cols-4">
          <div className="kpi">
            <p className="kpi-etichetta">INCASSATO {titolo}</p>
            <p className="kpi-valore text-green-400">{fmt(s.incassato)}</p>
            <p className="kpi-nota">{s.senzaFattura > 0 ? `di cui ${fmt(s.senzaFattura)} senza fattura` : 'fatture pagate e tranche'}</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">TASSE E INPS</p>
            <p className="kpi-valore text-amber-400">{fmt(s.tasse)}</p>
            <p className="kpi-nota">imposta {fmt(s.imposta)} · INPS {fmt(s.contributi)}</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">ABBONAMENTI</p>
            <p className="kpi-valore">{fmt(s.abbonamenti)}</p>
            <p className="kpi-nota">{s.mesi} {s.mesi === 1 ? 'mese' : 'mesi'}{annoInCorso ? ' finora' : ''}</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">NETTO {titolo}</p>
            <p className={`kpi-valore ${s.netto >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(s.netto)}</p>
            <p className="kpi-nota">{quota(s.netto)} dell’incassato, dopo tasse e abbonamenti</p>
          </div>
        </div>

        {/* Medie sul netto */}
        <div className="kpi-griglia sm:grid-cols-3">
          <div className="kpi">
            <p className="kpi-etichetta">MEDIA NETTO/MESE</p>
            <p className={`kpi-valore ${s.mediaNettoMese >= 0 ? '' : 'text-red-400'}`}>{fmt(s.mediaNettoMese)}</p>
            <p className="kpi-nota">su {s.mesi} {s.mesi === 1 ? 'mese' : 'mesi'}{annoInCorso ? ' trascorsi' : ''}</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">NETTO AL GIORNO</p>
            <p className="kpi-valore text-accent">{s.giorni ? fmt(s.nettoGiorno) : '—'}</p>
            <p className="kpi-nota">lordo {fmt(s.lordoGiorno)} · {s.giorni} giorni lav.</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">NETTO ALL’ORA</p>
            <p className="kpi-valore text-accent">{s.giorni ? fmt(s.nettoGiorno / 8) : '—'}</p>
            <p className="kpi-nota">lordo {fmt(s.lordoGiorno / 8)} · 8h al giorno</p>
          </div>
        </div>

        {/* Lavori del periodo */}
        <div className="kpi-griglia sm:grid-cols-3">
          <div className="kpi">
            <p className="kpi-etichetta">CONTRATTUALIZZATO</p>
            <p className="kpi-valore">{fmt(s.contrattualizzato)}</p>
            <p className="kpi-nota">{s.accettati.length} {s.accettati.length === 1 ? 'progetto accettato' : 'progetti accettati'}</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">DA INCASSARE</p>
            <p className="kpi-valore text-accent">{fmt(s.daIncassare)}</p>
            <p className="kpi-nota">residuo dei progetti accettati</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">TASSO ACCETTAZIONE</p>
            <p className="kpi-valore">{s.tassoAccettazione === null ? '—' : `${s.tassoAccettazione}%`}</p>
            <p className="kpi-nota">{s.rifiutati} rifiutati · {s.inAttesa} in attesa</p>
          </div>
        </div>

        {s.fisco && annoInCorso && <FiscoPannello fisco={s.fisco} impostazioni={fisco} />}

        {/* Grafico */}
        <div className="scheda">
          <p className="text-dim text-xs font-medium mb-4">{tab === 'totale' ? 'ANNO PER ANNO' : `MESE PER MESE · ${tab}`}</p>
          <div className="flex gap-x-4 gap-y-2 mb-5 flex-wrap">
            {LEGENDA.map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                <span className="text-muted text-xs">{l.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-1 sm:gap-1.5">
            {s.barre.map((b, i) => (
              <div key={b.label} className={`flex-1 flex flex-col items-center gap-1 group relative ${b.futuro ? 'opacity-30' : ''}`}>
                {!b.futuro && (b.incassato > 0 || b.abbonamenti > 0) && (
                  <div className={`absolute bottom-full mb-2 ${i < 3 ? 'left-0' : i > s.barre.length - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'} bg-surface2 border border-edge rounded-lg p-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none`}>
                    <p className="text-green-400">{fmt(b.incassato)} incassato</p>
                    <p className="text-amber-400">{fmt(b.tasse)} tasse e INPS</p>
                    <p className="text-accent">{fmt(b.abbonamenti)} abbonamenti</p>
                    <p className={b.netto >= 0 ? 'text-text font-medium' : 'text-red-400 font-medium'}>{fmt(b.netto)} netto</p>
                  </div>
                )}
                <div className="w-full flex items-end gap-px" style={{ height: 120 }}>
                  <div className="flex-1 rounded-t-sm bg-green-400" style={{ height: altezza(b.incassato) }} />
                  <div className="flex-1 rounded-t-sm bg-amber-400" style={{ height: altezza(b.tasse) }} />
                  <div className="flex-1 rounded-t-sm bg-accent" style={{ height: altezza(b.abbonamenti) }} />
                  <div className={`flex-1 rounded-t-sm ${b.netto >= 0 ? 'bg-muted' : 'bg-red-600'}`} style={{ height: altezza(Math.abs(b.netto)) }} />
                </div>
                <p className="text-dim text-[10px] sm:text-xs whitespace-nowrap">{b.label}</p>
              </div>
            ))}
          </div>
          {s.senzaFattura > 0 && (
            <p className="text-dim text-xs mt-4">
              Tasse e INPS sono calcolati sulle fatture pagate: i {fmt(s.senzaFattura)} incassati senza fattura non sono tassati.
            </p>
          )}
        </div>

        {/* Progetti accettati nel periodo */}
        <div className="bg-surface border border-edge rounded-xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-edge">
            <p className="text-dim text-xs font-medium">PROGETTI ACCETTATI · {titolo}</p>
          </div>
          {s.accettati.length === 0 ? (
            <div className="px-4 sm:px-5 py-10 text-center text-dim text-sm">Nessun progetto accettato nel periodo</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {s.accettati.map((p) => {
                const pagato = s.perPreventivo.get(p.id) ?? 0;
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
                        <p className="text-text text-sm font-bold tabular-nums">{fmt(Number(p.totale))}</p>
                        {pagato > 0 && <p className="text-green-400 text-xs tabular-nums">{`${fmt(pagato)} incassati`}</p>}
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
