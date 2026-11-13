'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { euroCent } from '@/lib/formato';
import { fmtMinuti, meseDi, nomeMese, type MeseCanone } from '@/lib/canone-calcolo';
import type { Canone, Intervento, Lavoro, Richiesta } from '@/lib/canone';

// Pannello "Canone ore" nella scheda cliente del gestionale.

export interface DatiCanoneAdmin {
  canone: Canone | null;
  corrente: MeseCanone | null;
  interventi: Intervento[];
  lavori: Lavoro[];
  richieste: Richiesta[];
}

const inputCls =
  'w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text placeholder-dim focus:outline-none focus:border-slate';
const btn = 'text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors disabled:opacity-40';
const btnPrimario = 'text-xs px-3 py-2 bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40';

const oggiRoma = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
const giorno = (d: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '';

const STATI_LAVORO = [
  ['da_avviare', 'Da avviare'],
  ['in_corso', 'In corso'],
  ['attesa_cliente', 'In attesa del cliente'],
  ['completato', 'Completato'],
] as const;

export default function CanoneAdmin({ clienteId, dati }: { clienteId: number; dati: DatiCanoneAdmin }) {
  const router = useRouter();
  const [errore, setErrore] = useState('');
  const [busy, setBusy] = useState(false);
  const [mostraCanone, setMostraCanone] = useState(!dati.canone);
  const [mostraLavoro, setMostraLavoro] = useState<number | 'nuovo' | null>(null);

  const invia = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErrore('');
    try {
      const res = await fetch(`/api/clienti/${clienteId}/canone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setErrore((await res.json().catch(() => ({}))).error || 'Errore');
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setBusy(false);
    }
  };

  const { canone, corrente } = dati;
  const aperte = dati.richieste.filter((r) => r.stato === 'nuova' || r.stato === 'stimata' || r.stato === 'approvata');
  const meseOra = meseDi(oggiRoma());
  const delMese = dati.interventi.filter((i) => meseDi(i.data) === meseOra);

  return (
    <section className="scheda">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-text font-semibold text-sm">Canone ore</h2>
        <div className="flex gap-2">
          {canone && (
            <a href={`/clienti/${clienteId}/anteprima`} className={btn}>Vedi come il cliente</a>
          )}
          {canone && (
            <button onClick={() => setMostraCanone((v) => !v)} className={btn}>
              {mostraCanone ? 'Chiudi' : 'Condizioni'}
            </button>
          )}
        </div>
      </div>

      {errore && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">{errore}</p>}

      {!canone && !mostraCanone && (
        <button onClick={() => setMostraCanone(true)} className={btn}>Attiva un canone ore</button>
      )}
      {mostraCanone && (
        <FormCanone canone={canone} busy={busy} onSalva={async (c) => { if (await invia({ azione: 'canone', ...c })) setMostraCanone(false); }} />
      )}

      {canone && corrente && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-surface2 rounded-xl p-3 mb-4 text-sm">
            <Kpi label={`${nomeMese(corrente.mese)}`} valore={`${fmtMinuti(corrente.rimaste)} rimaste`} forte />
            <Kpi label="Disponibili" valore={fmtMinuti(corrente.incluse + corrente.riportate)} />
            <Kpi label="Usate" valore={fmtMinuti(corrente.usate)} />
            <Kpi label="Extra" valore={corrente.extra ? `${fmtMinuti(corrente.extra)} · ${euroCent(corrente.costo_extra)}` : '-'} />
            <Kpi label="Fuori canone" valore={fmtMinuti(corrente.fuori_canone)} />
          </div>

          <FormIntervento canone={canone} richieste={aperte} lavori={dati.lavori} busy={busy}
            onSalva={(i) => invia({ azione: 'intervento', ...i })} />

          {/* Interventi del mese */}
          <h3 className="text-xs text-dim mt-5 mb-2">Interventi di {nomeMese(meseOra)} ({delMese.length})</h3>
          {delMese.length === 0 ? (
            <p className="text-dim text-xs">Nessuno.</p>
          ) : (
            <ul className="divide-y divide-edge">
              {delMese.map((i) => (
                <li key={i.id} className="py-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-text whitespace-pre-wrap">{i.descrizione}</p>
                    <p className="text-xs text-dim">{[giorno(i.data), i.sito, i.richiesto_da, i.fuori_canone && 'fuori canone'].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm tabular-nums">{fmtMinuti(i.minuti)}</span>
                    <button disabled={busy} onClick={() => confirm('Eliminare questo intervento?') && invia({ azione: 'elimina_intervento', id: i.id })}
                      className="text-xs text-dim hover:text-red-400 transition-colors" aria-label="Elimina">✕</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Richieste */}
      {canone && (
        <>
          <h3 className="text-xs text-dim mt-5 mb-2">Richieste aperte ({aperte.length})</h3>
          {aperte.length === 0 ? (
            <p className="text-dim text-xs">Nessuna.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {aperte.map((r) => (
                <RichiestaAdmin key={r.id} r={r} busy={busy} invia={invia} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Lavori */}
      {canone && (
        <>
          <div className="flex items-center justify-between mt-5 mb-2">
            <h3 className="text-xs text-dim">Lavori nella timeline ({dati.lavori.length})</h3>
            <button onClick={() => setMostraLavoro(mostraLavoro === 'nuovo' ? null : 'nuovo')} className={btn}>
              {mostraLavoro === 'nuovo' ? 'Annulla' : '+ Lavoro'}
            </button>
          </div>
          {mostraLavoro === 'nuovo' && (
            <FormLavoro siti={canone.siti} busy={busy}
              onSalva={async (l) => { if (await invia({ azione: 'lavoro', ...l })) setMostraLavoro(null); }} />
          )}
          <ul className="flex flex-col gap-2">
            {dati.lavori.map((l) => (
              <li key={l.id} className="bg-surface2 rounded-xl px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-text">{l.titolo}</p>
                    <p className="text-xs text-dim">
                      {[
                        STATI_LAVORO.find(([k]) => k === l.stato)?.[1],
                        l.sito,
                        l.inizio && `dal ${giorno(l.inizio)}`,
                        l.consegna_prevista && `consegna ${giorno(l.consegna_prevista)}`,
                        l.ore_stimate != null && `${fmtMinuti(l.minuti_usati)} / ${l.ore_stimate} h`,
                      ].filter(Boolean).join(' · ')}
                    </p>
                    {l.attesa_cliente && <p className="text-xs text-amber-400 mt-0.5">Serve: {l.attesa_cliente}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setMostraLavoro(mostraLavoro === l.id ? null : l.id)} className="text-xs text-dim hover:text-text">Modifica</button>
                    <button disabled={busy} onClick={() => confirm(`Eliminare "${l.titolo}"?`) && invia({ azione: 'elimina_lavoro', id: l.id })}
                      className="text-xs text-dim hover:text-red-400" aria-label="Elimina">✕</button>
                  </div>
                </div>
                {mostraLavoro === l.id && (
                  <div className="mt-3">
                    <FormLavoro lavoro={l} siti={canone.siti} busy={busy}
                      onSalva={async (x) => { if (await invia({ azione: 'lavoro', id: l.id, ...x })) setMostraLavoro(null); }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Kpi({ label, valore, forte }: { label: string; valore: string; forte?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-dim capitalize">{label}</p>
      <p className={`tabular-nums truncate ${forte ? 'font-semibold text-text' : 'text-muted'}`}>{valore}</p>
    </div>
  );
}

function Campo({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[11px] text-dim">{label}</span>
      {children}
    </label>
  );
}

function FormCanone({ canone, busy, onSalva }: { canone: Canone | null; busy: boolean; onSalva: (c: Record<string, unknown>) => void }) {
  const [f, setF] = useState({
    ore_mese: String(canone?.ore_mese ?? ''),
    prezzo_mese: String(canone?.prezzo_mese ?? ''),
    tariffa_extra: String(canone?.tariffa_extra ?? ''),
    inizio: canone?.inizio ?? `${meseDi(oggiRoma())}-01`,
    riporto_mesi: String(canone?.riporto_mesi ?? 1),
    siti: (canone?.siti ?? []).join(', '),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="bg-surface2 rounded-xl p-4 mb-4 flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Campo label="Ore al mese"><input type="number" step="0.5" value={f.ore_mese} onChange={set('ore_mese')} className={inputCls} /></Campo>
        <Campo label="Canone €/mese"><input type="number" step="0.01" value={f.prezzo_mese} onChange={set('prezzo_mese')} className={inputCls} /></Campo>
        <Campo label="Extra €/ora"><input type="number" step="0.01" value={f.tariffa_extra} onChange={set('tariffa_extra')} className={inputCls} /></Campo>
        <Campo label="Dal mese"><input type="date" value={f.inizio} onChange={set('inizio')} className={inputCls} /></Campo>
        <Campo label="Riporto (mesi)"><input type="number" min="0" max="12" value={f.riporto_mesi} onChange={set('riporto_mesi')} className={inputCls} /></Campo>
      </div>
      <Campo label="Siti (separati da virgola)">
        <input value={f.siti} onChange={set('siti')} placeholder="Ciccolella nuovo, Ciccolella vecchio, Cokito, SilkyBe" className={inputCls} />
      </Campo>
      <button disabled={busy} className={`${btnPrimario} self-start`}
        onClick={() => onSalva({ ...f, siti: f.siti.split(',').map((s) => s.trim()).filter(Boolean) })}>
        Salva condizioni
      </button>
    </div>
  );
}

function FormIntervento({ canone, richieste, lavori, busy, onSalva }: {
  canone: Canone; richieste: Richiesta[]; lavori: Lavoro[]; busy: boolean;
  onSalva: (i: Record<string, unknown>) => Promise<boolean>;
}) {
  const vuoto = { data: oggiRoma(), ore: '', sito: '', descrizione: '', richiesto_da: '', fuori_canone: false, richiesta_id: '', lavoro_id: '', completa_richiesta: false };
  const [f, setF] = useState(vuoto);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));
  const salva = async () => {
    if (await onSalva(f)) setF({ ...vuoto, data: f.data, sito: f.sito });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Campo label="Data"><input type="date" value={f.data} onChange={set('data')} className={inputCls} /></Campo>
        <Campo label="Durata (1:30, 1,5, 45m)"><input value={f.ore} onChange={set('ore')} placeholder="1:30" className={inputCls} /></Campo>
        <Campo label="Sito">
          <select value={f.sito} onChange={set('sito')} className={inputCls}>
            <option value="">-</option>
            {canone.siti.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Campo>
        <Campo label="Chiesto da"><input value={f.richiesto_da} onChange={set('richiesto_da')} placeholder="Isabella" className={inputCls} /></Campo>
      </div>
      <Campo label="Cosa ho fatto">
        <textarea rows={2} value={f.descrizione} onChange={set('descrizione')} placeholder="Descrizione visibile al cliente" className={inputCls} />
      </Campo>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {richieste.length > 0 && (
          <Campo label="Richiesta collegata">
            <select value={f.richiesta_id} onChange={set('richiesta_id')} className={inputCls}>
              <option value="">Nessuna</option>
              {richieste.map((r) => <option key={r.id} value={r.id}>{r.testo.slice(0, 60)}</option>)}
            </select>
          </Campo>
        )}
        {lavori.length > 0 && (
          <Campo label="Lavoro collegato">
            <select value={f.lavoro_id} onChange={set('lavoro_id')} className={inputCls}>
              <option value="">Nessuno</option>
              {lavori.filter((l) => l.stato !== 'completato').map((l) => <option key={l.id} value={l.id}>{l.titolo}</option>)}
            </select>
          </Campo>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={f.fuori_canone} onChange={set('fuori_canone')} /> Fuori canone
        </label>
        {f.richiesta_id && (
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={f.completa_richiesta} onChange={set('completa_richiesta')} /> Richiesta completata
          </label>
        )}
        <button disabled={busy || !f.ore || !f.descrizione.trim()} onClick={salva} className={`${btnPrimario} ml-auto`}>
          Registra intervento
        </button>
      </div>
    </div>
  );
}

function RichiestaAdmin({ r, busy, invia }: { r: Richiesta; busy: boolean; invia: (b: Record<string, unknown>) => Promise<boolean> }) {
  const [f, setF] = useState({ ore_stimate: r.ore_stimate != null ? String(r.ore_stimate) : '', consegna_prevista: r.consegna_prevista ?? '', risposta: r.risposta ?? '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const etichetta = { nuova: 'Da stimare', stimata: 'Stima inviata', approvata: 'Approvata' } as Record<string, string>;
  return (
    <div className="bg-surface2 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-dim">{[r.sito, r.urgente && 'URGENTE', giorno(r.creata_il?.slice(0, 10) ?? null)].filter(Boolean).join(' · ')}</p>
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${r.stato === 'nuova' ? 'bg-accent text-on-accent' : 'bg-bg text-muted'}`}>{etichetta[r.stato]}</span>
      </div>
      <p className="text-sm text-text mt-1 whitespace-pre-wrap">{r.testo}</p>
      {r.stato !== 'approvata' ? (
        <div className="grid grid-cols-2 md:grid-cols-[100px_150px_1fr_auto] gap-2 mt-3 items-end">
          <Campo label="Ore stimate"><input value={f.ore_stimate} onChange={set('ore_stimate')} placeholder="1,5" className={inputCls} /></Campo>
          <Campo label="Consegna"><input type="date" value={f.consegna_prevista} onChange={set('consegna_prevista')} className={inputCls} /></Campo>
          <Campo label="Nota per il cliente" className="col-span-2 md:col-span-1"><input value={f.risposta} onChange={set('risposta')} className={inputCls} /></Campo>
          <button disabled={busy || !f.ore_stimate} onClick={() => invia({ azione: 'stima', id: r.id, ...f })} className={`${btnPrimario} col-span-2 md:col-span-1`}>
            {r.stato === 'stimata' ? 'Aggiorna stima' : 'Invia stima'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted mt-1">Stima {r.ore_stimate} h approvata. Registra l&apos;intervento collegandolo a questa richiesta.</p>
      )}
      <div className="flex gap-3 mt-2">
        {r.stato !== 'approvata' && (
          <button disabled={busy} onClick={() => invia({ azione: 'stato_richiesta', id: r.id, stato: 'approvata' })} className="text-xs text-dim hover:text-text">Approvata a voce</button>
        )}
        <button disabled={busy} onClick={() => invia({ azione: 'stato_richiesta', id: r.id, stato: 'completata' })} className="text-xs text-dim hover:text-text">Segna fatta</button>
        <button disabled={busy} onClick={() => invia({ azione: 'stato_richiesta', id: r.id, stato: 'rifiutata' })} className="text-xs text-dim hover:text-red-400">Archivia</button>
      </div>
    </div>
  );
}

function FormLavoro({ lavoro, siti, busy, onSalva }: { lavoro?: Lavoro; siti: string[]; busy: boolean; onSalva: (l: Record<string, unknown>) => void }) {
  const [f, setF] = useState({
    titolo: lavoro?.titolo ?? '',
    sito: lavoro?.sito ?? '',
    stato: lavoro?.stato ?? 'in_corso',
    inizio: lavoro?.inizio ?? oggiRoma(),
    consegna_prevista: lavoro?.consegna_prevista ?? '',
    ore_stimate: lavoro?.ore_stimate != null ? String(lavoro.ore_stimate) : '',
    attesa_cliente: lavoro?.attesa_cliente ?? '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <div className="bg-bg/40 border border-edge rounded-xl p-3 mb-3 flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Campo label="Titolo" className="col-span-2 md:col-span-1"><input value={f.titolo} onChange={set('titolo')} className={inputCls} /></Campo>
        <Campo label="Sito">
          <select value={f.sito} onChange={set('sito')} className={inputCls}>
            <option value="">-</option>
            {siti.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Campo>
        <Campo label="Stato">
          <select value={f.stato} onChange={set('stato')} className={inputCls}>
            {STATI_LAVORO.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Campo>
        <Campo label="Inizio"><input type="date" value={f.inizio} onChange={set('inizio')} className={inputCls} /></Campo>
        <Campo label="Consegna stimata"><input type="date" value={f.consegna_prevista} onChange={set('consegna_prevista')} className={inputCls} /></Campo>
        <Campo label="Ore stimate"><input value={f.ore_stimate} onChange={set('ore_stimate')} placeholder="4" className={inputCls} /></Campo>
      </div>
      {f.stato === 'attesa_cliente' && (
        <Campo label="Cosa serve dal cliente">
          <input value={f.attesa_cliente} onChange={set('attesa_cliente')} placeholder="I testi di Il Gallo e La Massaia" className={inputCls} />
        </Campo>
      )}
      <button disabled={busy || !f.titolo.trim()} onClick={() => onSalva({ ...f, attesa_cliente: f.stato === 'attesa_cliente' ? f.attesa_cliente : '' })}
        className={`${btnPrimario} self-start`}>
        Salva lavoro
      </button>
    </div>
  );
}
