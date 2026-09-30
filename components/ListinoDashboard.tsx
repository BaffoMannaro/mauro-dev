'use client';

import { Fragment, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { calcolaListino, daClassificare, type Azione, type Osservazione, type Statistica } from '@/lib/listino';
import { FONTI, FONTE_BADGE, fonteLabel } from '@/lib/fonti';

const fmt = (n: number) => `€${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const dataIt = (d: string) => d.split('-').reverse().join('/');
const FONTI_IDS = FONTI.map((f) => f.id as string);

const inputCls =
  'bg-bg border border-edge rounded-lg px-2.5 py-1.5 text-sm text-text placeholder-dim focus:outline-none focus:border-slate';

function Cella({ s }: { s: Statistica | null }) {
  if (!s) return <span className="text-dim">—</span>;
  return (
    <div>
      <p className="text-text font-semibold">{fmt(s.media)}</p>
      <p className="text-dim text-xs whitespace-nowrap">
        {s.n}× {s.n > 1 && <>· {fmt(s.min)}–{fmt(s.max)}</>}
      </p>
    </div>
  );
}

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Operazione non riuscita');
  return res.json();
}

export default function ListinoDashboard({ osservazioni, azioni }: { osservazioni: Osservazione[]; azioni: Azione[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [soloSvolti, setSoloSvolti] = useState(true);
  const [aperta, setAperta] = useState<number | null>(null);
  const [errore, setErrore] = useState('');
  const [nuovaAzione, setNuovaAzione] = useState('');

  const righe = useMemo(() => calcolaListino(osservazioni, azioni, { soloSvolti, fonti: FONTI_IDS }), [osservazioni, azioni, soloSvolti]);
  const libere = useMemo(() => daClassificare(osservazioni), [osservazioni]);
  const conSenzaFonte = righe.some((r) => r.per_fonte.nessuna);
  const clientiSenzaFonte = new Set(osservazioni.filter((o) => !o.fonte).map((o) => o.cliente)).size;
  const classificate = osservazioni.filter((o) => o.azione_id != null).length;

  const esegui = async (fn: () => Promise<unknown>) => {
    setErrore('');
    try {
      await fn();
      startTransition(() => router.refresh());
    } catch (e) {
      setErrore((e as Error).message);
    }
  };

  const assegna = (descrizione: string, valore: string) =>
    esegui(async () => {
      let id = Number(valore);
      if (valore === 'nuova') {
        const nome = prompt('Nome della nuova azione (es. "Landing page")', descrizione.slice(0, 60));
        if (!nome) return;
        id = (await api('/api/listino/azioni', 'POST', { nome })).id;
      }
      await api('/api/listino/classifica', 'POST', { descrizioni: [descrizione], azione_id: id });
    });

  return (
    <div className="min-h-screen text-text">
      <header className="border-b border-edge px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Listino</h1>
          <p className="text-dim text-sm mt-0.5">
            Quanto quoti ogni tipo di lavoro, per fonte del cliente. Interno: non compare mai nei preventivi.
          </p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className="text-sm text-muted">Solo lavori svolti</span>
          <button
            type="button"
            role="switch"
            aria-checked={soloSvolti}
            onClick={() => setSoloSvolti((v) => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${soloSvolti ? 'bg-accent' : 'bg-edge'}`}
          >
            <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${soloSvolti ? 'translate-x-4' : ''}`} />
          </button>
        </label>
      </header>

      <div className={`px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6 ${pending ? 'opacity-60' : ''}`}>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <span><strong className="text-text">{classificate}</strong> voci classificate su {osservazioni.length}</span>
          <span><strong className="text-text">{azioni.length}</strong> azioni</span>
          {clientiSenzaFonte > 0 && (
            <a href="/clienti" className="text-amber-400 hover:underline">{clientiSenzaFonte} clienti senza fonte →</a>
          )}
        </div>

        {errore && <p className="text-red-400 text-xs font-mono">⚠ {errore}</p>}

        {/* Listino */}
        <section className="bg-surface border border-edge rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-edge flex items-center justify-between gap-3 flex-wrap">
            <p className="text-dim text-xs font-medium">PREZZO MEDIO PER AZIONE {soloSvolti ? '· lavori accettati o fatturati' : '· tutti i preventivi'}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!nuovaAzione.trim()) return;
                esegui(() => api('/api/listino/azioni', 'POST', { nome: nuovaAzione })).then(() => setNuovaAzione(''));
              }}
              className="flex gap-2"
            >
              <input value={nuovaAzione} onChange={(e) => setNuovaAzione(e.target.value)} placeholder="Nuova azione…" className={`${inputCls} w-44`} />
              <button className="px-3 py-1.5 bg-accent text-on-accent text-xs font-semibold rounded-lg cursor-pointer">Aggiungi</button>
            </form>
          </div>

          {righe.length === 0 ? (
            <p className="text-dim text-sm px-5 py-6">
              Nessuna azione ancora. Creane una o chiedi a Claude: <em>“classifica le voci del listino”</em>.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-dim text-xs text-left">
                    <th className="px-5 py-2.5 font-medium">Azione</th>
                    <th className="px-3 py-2.5 font-medium">Tutte</th>
                    {FONTI.map((f) => (
                      <th key={f.id} className="px-3 py-2.5 font-medium">
                        <span className={`px-1.5 py-0.5 rounded border ${FONTE_BADGE[f.id]}`}>{f.label}</span>
                      </th>
                    ))}
                    {conSenzaFonte && <th className="px-3 py-2.5 font-medium text-amber-400">Senza fonte</th>}
                  </tr>
                </thead>
                <tbody>
                  {righe.map((r, i) => {
                    const prevCat = i > 0 ? righe[i - 1].azione.categoria : undefined;
                    const voci = osservazioni.filter((o) => o.azione_id === r.azione.id && (!soloSvolti || o.svolto));
                    return (
                      <Fragment key={r.azione.id}>
                        {r.azione.categoria && r.azione.categoria !== prevCat && (
                          <tr><td colSpan={9} className="px-5 pt-4 pb-1 text-dim text-xs font-medium uppercase tracking-wider">{r.azione.categoria}</td></tr>
                        )}
                        <tr
                          onClick={() => setAperta(aperta === r.azione.id ? null : r.azione.id)}
                          className={`border-t border-edge/60 align-top cursor-pointer transition-colors ${aperta === r.azione.id ? 'bg-surface2' : 'hover:bg-surface2/50'}`}
                        >
                          <td className="px-5 py-3">
                            <p className="font-medium">{r.azione.nome}</p>
                            {r.azione.unita && <p className="text-dim text-xs">{r.azione.unita}</p>}
                          </td>
                          <td className="px-3 py-3"><Cella s={r.per_fonte.tutte} /></td>
                          {FONTI.map((f) => <td key={f.id} className="px-3 py-3"><Cella s={r.per_fonte[f.id]} /></td>)}
                          {conSenzaFonte && <td className="px-3 py-3"><Cella s={r.per_fonte.nessuna} /></td>}
                        </tr>
                        {aperta === r.azione.id && (
                          <tr className="bg-surface2/60">
                            <td colSpan={9} className="px-5 pb-4">
                              <DettaglioAzione azione={r.azione} voci={voci} azioni={azioni} esegui={esegui} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Da classificare */}
        {libere.length > 0 && (
          <section className="bg-surface border border-edge rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-edge">
              <p className="text-dim text-xs font-medium">DA CLASSIFICARE ({libere.length})</p>
              <p className="text-dim text-xs mt-1">
                Assegna ogni voce a un’azione: le stesse descrizioni in futuro verranno riconosciute da sole. Più veloce: chiedi a Claude
                di “classificare le voci del listino”.
              </p>
            </div>
            {libere.map((g) => (
              <div key={g.chiave} className="px-5 py-3 border-t border-edge/60 first:border-t-0 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate" title={g.descrizione}>{g.descrizione}</p>
                  <p className="text-dim text-xs truncate">
                    {g.prezzi.map(fmt).join(' · ')} — {g.clienti.join(', ')}
                  </p>
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && assegna(g.descrizione, e.target.value)}
                  className={`${inputCls} w-full sm:w-56 shrink-0`}
                >
                  <option value="" disabled>Assegna a…</option>
                  {azioni.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  <option value="nuova">+ Nuova azione…</option>
                </select>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

function DettaglioAzione({
  azione,
  voci,
  azioni,
  esegui,
}: {
  azione: Azione;
  voci: Osservazione[];
  azioni: Azione[];
  esegui: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [nome, setNome] = useState(azione.nome);
  const [categoria, setCategoria] = useState(azione.categoria ?? '');
  const [unita, setUnita] = useState(azione.unita ?? '');

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex flex-wrap gap-2 items-center">
        <input value={nome} onChange={(e) => setNome(e.target.value)} className={`${inputCls} w-52`} aria-label="Nome azione" />
        <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria (es. Siti web)" className={`${inputCls} w-44`} />
        <input value={unita} onChange={(e) => setUnita(e.target.value)} placeholder="Unità (es. a pagina)" className={`${inputCls} w-36`} />
        <button
          onClick={() => esegui(() => api(`/api/listino/azioni/${azione.id}`, 'PATCH', { nome, categoria, unita }))}
          className="px-3 py-1.5 bg-accent text-on-accent text-xs font-semibold rounded-lg cursor-pointer"
        >
          Salva
        </button>
        <select
          defaultValue=""
          onChange={(e) =>
            e.target.value &&
            confirm(`Unire "${azione.nome}" nell’azione scelta?`) &&
            esegui(() => api(`/api/listino/azioni/${azione.id}`, 'PATCH', { unisci_in: Number(e.target.value) }))
          }
          className={`${inputCls} w-44`}
        >
          <option value="" disabled>Unisci in…</option>
          {azioni.filter((a) => a.id !== azione.id).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
        <button
          onClick={() =>
            confirm(`Eliminare l’azione "${azione.nome}"? Le sue voci tornano da classificare.`) &&
            esegui(() => api(`/api/listino/azioni/${azione.id}`, 'DELETE'))
          }
          className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 rounded-lg cursor-pointer"
        >
          Elimina
        </button>
      </div>

      {voci.length === 0 ? (
        <p className="text-dim text-sm">Nessuna voce con i filtri attuali.</p>
      ) : (
        <div className="flex flex-col divide-y divide-edge/60 bg-surface rounded-lg border border-edge">
          {voci.map((v, i) => (
            <div key={`${v.origine}-${v.rif_id}-${i}`} className="px-4 py-2.5 flex items-center gap-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate" title={v.descrizione}>{v.descrizione}</p>
                <p className="text-dim text-xs truncate">
                  {dataIt(v.data)} · {v.cliente} · {v.origine === 'preventivo' ? `Preventivo: ${v.rif}` : v.rif}
                  {!v.svolto && ` · ${v.stato}`}
                </p>
              </div>
              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${v.fonte ? FONTE_BADGE[v.fonte] : 'text-amber-400 border-amber-400/40'}`}>
                {fonteLabel(v.fonte)}
              </span>
              <p className="shrink-0 font-semibold w-24 text-right">
                {v.quantita !== 1 && <span className="text-dim font-normal text-xs">{v.quantita}× </span>}
                {fmt(v.prezzo)}
              </p>
              <button
                onClick={() => esegui(() => api('/api/listino/classifica', 'POST', { descrizioni: [v.descrizione], azione_id: null }))}
                title="Togli da questa azione"
                className="shrink-0 text-dim hover:text-text cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
