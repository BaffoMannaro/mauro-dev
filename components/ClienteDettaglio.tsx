'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { calcFinanza } from '@/lib/preventivo-finance';

interface Cliente {
  id: number;
  nome: string;
  azienda: string | null;
  email: string | null;
  telefono: string | null;
  piva: string | null;
  codice_fiscale: string | null;
  indirizzo: string | null;
  pec: string | null;
  codice_sdi: string | null;
  note: string | null;
  data_inizio: string | null;
  created_at: string;
}

interface Prev {
  id: number;
  token: string;
  oggetto: string;
  totale: number | string;
  stato: string;
  tranches_stato: { percentuale: number; pagato: boolean }[] | null;
  lavoro_inizio: string | null;
  lavoro_fine: string | null;
  accettato_at: string | null;
  created_at: string;
}

interface PrevLibero {
  id: number;
  oggetto: string;
  cliente_nome: string;
  cliente_email: string | null;
  totale: number | string;
  stato: string;
  created_at: string;
}

interface AltroCliente {
  id: number;
  nome: string;
  azienda: string | null;
  email: string | null;
}

const fmt = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtData = (d: string | null) => (d ? new Date(d).toLocaleDateString('it-IT') : '—');

const STATO: Record<string, { label: string; cls: string }> = {
  inviato:     { label: 'Inviato',     cls: 'text-blue-400 border-blue-800/60 bg-blue-950/30' },
  accettato:   { label: 'Accettato',   cls: 'text-green-400 border-green-800/60 bg-green-950/30' },
  rifiutato:   { label: 'Rifiutato',   cls: 'text-red-400 border-red-950/50 bg-red-950/30' },
  archiviato:  { label: 'Archiviato',  cls: 'text-muted border-edge bg-surface2' },
};

const inputCls =
  'w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text placeholder-dim focus:outline-none focus:border-slate';

export default function ClienteDettaglio({
  cliente,
  preventivi,
  nonAssociati,
  altriClienti,
}: {
  cliente: Cliente;
  preventivi: Prev[];
  nonAssociati: PrevLibero[];
  altriClienti: AltroCliente[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showAssoc, setShowAssoc] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeErr, setMergeErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: cliente.nome ?? '',
    azienda: cliente.azienda ?? '',
    email: cliente.email ?? '',
    telefono: cliente.telefono ?? '',
    piva: cliente.piva ?? '',
    codice_fiscale: cliente.codice_fiscale ?? '',
    indirizzo: cliente.indirizzo ?? '',
    pec: cliente.pec ?? '',
    codice_sdi: cliente.codice_sdi ?? '',
    note: cliente.note ?? '',
    data_inizio: cliente.data_inizio ? new Date(cliente.data_inizio).toISOString().slice(0, 10) : '',
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const finanza = calcFinanza(preventivi);
  const accettati = preventivi.filter((p) => p.stato === 'accettato' || p.stato === 'archiviato');
  const inCorso = accettati.filter((p) => !p.lavoro_fine);
  const completati = accettati.filter((p) => p.lavoro_fine);

  const salvaAnagrafica = async () => {
    setLoading(true);
    const res = await fetch(`/api/clienti/${cliente.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setShowEdit(false);
      router.refresh();
    }
  };

  const collega = async (pid: number) => {
    setBusyId(pid);
    const res = await fetch(`/api/clienti/${cliente.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_ids: [pid] }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  };

  const scollega = async (pid: number) => {
    if (!confirm('Scollegare questo preventivo dal cliente?')) return;
    setBusyId(pid);
    const res = await fetch(`/api/clienti/${cliente.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unlink_ids: [pid] }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
  };

  const elimina = async () => {
    if (!confirm('Eliminare questo cliente? I preventivi collegati verranno scollegati ma non eliminati.')) return;
    const res = await fetch(`/api/clienti/${cliente.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/preventivi/clienti');
  };

  const unisci = async (sourceId: number) => {
    setBusyId(sourceId);
    setMergeErr('');
    try {
      const res = await fetch(`/api/clienti/${cliente.id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Errore durante l\'unione');
      }
      setShowMerge(false);
      router.refresh();
    } catch (e: any) {
      setMergeErr(e.message || 'Errore durante l\'unione');
    } finally {
      setBusyId(null);
    }
  };

  const Anagrafica = ({ label, value }: { label: string; value: string | null }) =>
    value ? (
      <div>
        <p className="text-dim text-xs">{label}</p>
        <p className="text-text text-sm">{value}</p>
      </div>
    ) : null;

  return (
    <div className="min-h-screen text-text">
      {/* Header */}
      <header className="border-b border-edge px-6 py-5">
        <Link href="/preventivi/clienti" className="text-dim hover:text-text text-sm transition-colors">← Clienti</Link>
        <div className="flex items-start justify-between gap-3 mt-2">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{cliente.nome}</h1>
            {cliente.azienda && cliente.azienda !== cliente.nome && (
              <p className="text-muted text-sm">{cliente.azienda}</p>
            )}
            <p className="text-dim text-xs mt-1">Cliente dal {fmtData(cliente.data_inizio)}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowEdit(true)} className="text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors">Modifica</button>
            <button onClick={() => { setMergeErr(''); setShowMerge(true); }} className="text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors">Unisci</button>
            <button onClick={elimina} className="text-xs px-3 py-1.5 bg-surface2 hover:bg-red-950/50 text-red-400 rounded-lg transition-colors">Elimina</button>
          </div>
        </div>
      </header>

      <div className="px-6 py-6 max-w-5xl mx-auto flex flex-col gap-6">
        {/* Recap importi */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'TOTALE', value: fmt(finanza.totale), color: 'text-text' },
            { label: 'RICEVUTI', value: fmt(finanza.ricevuto), color: 'text-green-400' },
            { label: 'DA RICEVERE', value: fmt(finanza.daDare), color: 'text-amber-400' },
          ].map((k) => (
            <div key={k.label} className="bg-surface border border-edge rounded-xl p-5">
              <p className="text-dim text-xs font-medium mb-2">{k.label}</p>
              <p className={`text-xl md:text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Anagrafica */}
        <section className="bg-surface border border-edge rounded-xl p-5">
          <h2 className="text-text font-semibold text-sm mb-4">Anagrafica</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Anagrafica label="Email" value={cliente.email} />
            <Anagrafica label="Telefono" value={cliente.telefono} />
            <Anagrafica label="P. IVA" value={cliente.piva} />
            <Anagrafica label="Codice fiscale" value={cliente.codice_fiscale} />
            <Anagrafica label="Indirizzo" value={cliente.indirizzo} />
            <Anagrafica label="PEC" value={cliente.pec} />
            <Anagrafica label="Codice SDI" value={cliente.codice_sdi} />
            <Anagrafica label="Note" value={cliente.note} />
          </div>
          {!cliente.email && !cliente.piva && !cliente.telefono && !cliente.indirizzo && (
            <p className="text-dim text-sm">Nessun dato anagrafico. Clicca "Modifica" per aggiungerne.</p>
          )}
        </section>

        {/* Preventivi */}
        <section className="bg-surface border border-edge rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-text font-semibold text-sm">Preventivi <span className="text-dim font-normal">({preventivi.length})</span></h2>
            <button onClick={() => setShowAssoc(true)} className="text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors">+ Collega preventivo</button>
          </div>
          {preventivi.length === 0 ? (
            <p className="text-dim text-sm">Nessun preventivo collegato.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {preventivi.map((p) => {
                const st = STATO[p.stato] ?? { label: p.stato, cls: 'text-muted border-edge bg-surface2' };
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 bg-surface2 rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                        <p className="text-text text-sm font-medium truncate">{p.oggetto}</p>
                      </div>
                      <p className="text-dim text-xs mt-1">{fmt(Number(p.totale))} · {fmtData(p.accettato_at || p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={`/p/${p.token}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-surface hover:bg-slate text-muted hover:text-text rounded-lg transition-colors border border-edge">Apri</a>
                      <button onClick={() => scollega(p.id)} disabled={busyId === p.id} className="text-xs px-2 py-1.5 text-dim hover:text-red-400 transition-colors disabled:opacity-30" title="Scollega">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Lavori */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <section className="bg-surface border border-edge rounded-xl p-5">
            <h2 className="text-text font-semibold text-sm mb-3">In corso <span className="text-dim font-normal">({inCorso.length})</span></h2>
            {inCorso.length === 0 ? (
              <p className="text-dim text-sm">Nessun lavoro in corso.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {inCorso.map((p) => (
                  <div key={p.id} className="bg-surface2 rounded-lg px-3 py-2">
                    <p className="text-text text-sm truncate">{p.oggetto}</p>
                    <p className="text-dim text-xs mt-0.5">{p.lavoro_inizio ? `Iniziato il ${fmtData(p.lavoro_inizio)}` : 'Non ancora iniziato'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="bg-surface border border-edge rounded-xl p-5">
            <h2 className="text-text font-semibold text-sm mb-3">Completati <span className="text-dim font-normal">({completati.length})</span></h2>
            {completati.length === 0 ? (
              <p className="text-dim text-sm">Nessun lavoro completato.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {completati.map((p) => (
                  <div key={p.id} className="bg-surface2 rounded-lg px-3 py-2">
                    <p className="text-text text-sm truncate">{p.oggetto}</p>
                    <p className="text-dim text-xs mt-0.5">Completato il {fmtData(p.lavoro_fine)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Fatture (placeholder) */}
        <section className="bg-surface border border-edge rounded-xl p-5">
          <h2 className="text-text font-semibold text-sm mb-2">Fatture emesse</h2>
          <div className="text-dim text-sm border border-dashed border-edge rounded-lg py-8 text-center">
            Gestione fatture in arrivo — prossimamente.
          </div>
        </section>
      </div>

      {/* Modal modifica anagrafica */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-surface border border-edge rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-text font-semibold">Modifica cliente</h2>
              <button onClick={() => setShowEdit(false)} className="text-dim hover:text-text transition-colors">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-dim text-xs font-medium block mb-1">NOME *</label>
                <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">AZIENDA</label>
                  <input type="text" value={form.azienda} onChange={(e) => set('azienda', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">INIZIO RAPPORTO</label>
                  <input type="date" value={form.data_inizio} onChange={(e) => set('data_inizio', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">EMAIL</label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">TELEFONO</label>
                  <input type="text" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">P. IVA</label>
                  <input type="text" value={form.piva} onChange={(e) => set('piva', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">CODICE FISCALE</label>
                  <input type="text" value={form.codice_fiscale} onChange={(e) => set('codice_fiscale', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-dim text-xs font-medium block mb-1">INDIRIZZO</label>
                <input type="text" value={form.indirizzo} onChange={(e) => set('indirizzo', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">PEC</label>
                  <input type="email" value={form.pec} onChange={(e) => set('pec', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">CODICE SDI</label>
                  <input type="text" value={form.codice_sdi} onChange={(e) => set('codice_sdi', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-dim text-xs font-medium block mb-1">NOTE</label>
                <input type="text" value={form.note} onChange={(e) => set('note', e.target.value)} className={inputCls} />
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors">Annulla</button>
                <button onClick={salvaAnagrafica} disabled={loading || !form.nome.trim()} className="flex-1 py-2.5 text-sm bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-30">
                  {loading ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal associa preventivo */}
      {showAssoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-surface border border-edge rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-text font-semibold">Collega un preventivo</h2>
              <button onClick={() => setShowAssoc(false)} className="text-dim hover:text-text transition-colors">✕</button>
            </div>
            <p className="text-dim text-xs mb-5">Preventivi non ancora associati ad alcun cliente.</p>
            {nonAssociati.length === 0 ? (
              <div className="text-center py-12 text-dim text-sm">Nessun preventivo disponibile.</div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {nonAssociati.map((p) => {
                  const st = STATO[p.stato] ?? { label: p.stato, cls: 'text-muted border-edge bg-surface2' };
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 bg-surface2 rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                          <p className="text-text text-sm font-medium truncate">{p.oggetto}</p>
                        </div>
                        <p className="text-dim text-xs mt-1 truncate">{p.cliente_nome} · {fmt(Number(p.totale))}</p>
                      </div>
                      <button onClick={() => collega(p.id)} disabled={busyId === p.id} className="shrink-0 text-xs px-3 py-1.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-30">
                        {busyId === p.id ? '...' : 'Collega'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => setShowAssoc(false)} className="w-full mt-5 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors">Chiudi</button>
          </div>
        </div>
      )}

      {/* Modal unisci cliente */}
      {showMerge && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-surface border border-edge rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-text font-semibold">Unisci un cliente in questo</h2>
              <button onClick={() => setShowMerge(false)} className="text-dim hover:text-text transition-colors">✕</button>
            </div>
            <p className="text-dim text-xs mb-5">
              Il cliente scelto verrà assorbito in <span className="text-text font-medium">{cliente.nome}</span>: i suoi preventivi passeranno qui, i dati anagrafici mancanti verranno ereditati e il cliente scelto sarà eliminato.
            </p>
            {altriClienti.length === 0 ? (
              <div className="text-center py-12 text-dim text-sm">Nessun altro cliente disponibile.</div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {altriClienti.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 bg-surface2 rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-text text-sm font-medium truncate">{c.nome}</p>
                      <p className="text-dim text-xs truncate">{c.azienda || c.email || 'nessun dato'}</p>
                    </div>
                    <button
                      onClick={() => unisci(c.id)}
                      disabled={busyId === c.id}
                      className="shrink-0 text-xs px-3 py-1.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-30"
                    >
                      {busyId === c.id ? '...' : 'Unisci qui'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {mergeErr && <p className="text-red-400 text-xs font-mono mt-4">⚠ {mergeErr}</p>}
            <button onClick={() => setShowMerge(false)} className="w-full mt-5 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors">Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}
