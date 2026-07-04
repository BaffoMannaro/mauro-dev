'use client';

import { useState, useMemo } from 'react';
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
  cliente_id: number | null;
  cliente_nome: string;
  cliente_azienda: string | null;
  cliente_email: string | null;
  totale: number | string;
  stato: string;
  tranches_stato: { percentuale: number; pagato: boolean }[] | null;
  accettato_at: string | null;
  created_at: string;
  meta?: { cliente?: { piva?: string; telefono?: string } } | null;
}

const fmt = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtData = (d: string | null) => (d ? new Date(d).toLocaleDateString('it-IT') : '—');

const FORM_DEFAULT = {
  nome: '', azienda: '', email: '', telefono: '', piva: '',
  codice_fiscale: '', indirizzo: '', pec: '', codice_sdi: '', note: '',
  data_inizio: new Date().toISOString().slice(0, 10),
};

const inputCls =
  'w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text placeholder-dim focus:outline-none focus:border-slate';

export default function ClientiDashboard({
  clienti,
  preventivi,
}: {
  clienti: Cliente[];
  preventivi: Prev[];
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState(FORM_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [errore, setErrore] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showMerge, setShowMerge] = useState(false);
  const [merging, setMerging] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSel = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exitSelect = () => { setSelectMode(false); setSelected(new Set()); setShowMerge(false); };

  const selezionati = clienti.filter((c) => selected.has(c.id));

  const eseguiMerge = async (targetId: number) => {
    const sources = [...selected].filter((id) => id !== targetId);
    if (sources.length === 0) return;
    const target = clienti.find((c) => c.id === targetId);
    if (!confirm(`Unire ${sources.length} client${sources.length === 1 ? 'e' : 'i'} in "${target?.nome}"? I loro preventivi passeranno a questo cliente e verranno eliminati.`)) return;
    setMerging(true);
    for (const s of sources) {
      const res = await fetch(`/api/clienti/${targetId}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: s }),
      });
      if (!res.ok) break;
    }
    setMerging(false);
    exitSelect();
    router.refresh();
  };

  // Preventivi raggruppati per cliente
  const prevByCliente = useMemo(() => {
    const m = new Map<number, Prev[]>();
    for (const p of preventivi) {
      if (p.cliente_id == null) continue;
      const arr = m.get(p.cliente_id) ?? [];
      arr.push(p);
      m.set(p.cliente_id, arr);
    }
    return m;
  }, [preventivi]);

  // Candidati all'import: preventivi accettati non associati, raggruppati per email,
  // escludendo email già presenti tra i clienti.
  const candidati = useMemo(() => {
    const esistenti = new Set(
      clienti.map((c) => (c.email || '').toLowerCase()).filter(Boolean)
    );
    const groups = new Map<
      string,
      { email: string; nome: string; azienda: string; piva: string; telefono: string; dataInizio: string; ids: number[]; totale: number }
    >();
    for (const p of preventivi) {
      if (p.cliente_id != null) continue;
      if (p.stato !== 'accettato' && p.stato !== 'archiviato') continue;
      const email = (p.cliente_email || '').toLowerCase();
      if (email && esistenti.has(email)) continue;
      const key = email || `__id${p.id}`;
      const d = p.accettato_at || p.created_at;
      const g = groups.get(key) ?? {
        email: p.cliente_email || '',
        nome: p.cliente_nome,
        azienda: p.cliente_azienda || '',
        piva: p.meta?.cliente?.piva || '',
        telefono: p.meta?.cliente?.telefono || '',
        dataInizio: d,
        ids: [],
        totale: 0,
      };
      g.ids.push(p.id);
      g.totale += Number(p.totale) || 0;
      if (d && new Date(d) < new Date(g.dataInizio)) g.dataInizio = d;
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [preventivi, clienti]);

  // KPI globali
  const totali = useMemo(() => {
    const f = calcFinanza(preventivi.filter((p) => p.cliente_id != null));
    return f;
  }, [preventivi]);

  const salvaNuovo = async () => {
    setErrore('');
    if (!form.nome.trim()) return setErrore('Il nome è obbligatorio');
    setLoading(true);
    const res = await fetch('/api/clienti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setShowNew(false);
      setForm(FORM_DEFAULT);
      router.refresh();
    } else {
      setErrore('Errore nel salvataggio');
    }
  };

  const importa = async (c: (typeof candidati)[number]) => {
    const key = c.email || `__id${c.ids[0]}`;
    setBusyKey(key);
    const res = await fetch('/api/clienti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: c.nome,
        azienda: c.azienda || null,
        email: c.email || null,
        piva: c.piva || null,
        telefono: c.telefono || null,
        data_inizio: c.dataInizio ? new Date(c.dataInizio).toISOString().slice(0, 10) : null,
        link_ids: c.ids,
      }),
    });
    setBusyKey(null);
    if (res.ok) router.refresh();
  };

  return (
    <div className="min-h-screen text-text">
      {/* Header */}
      <header className="border-b border-edge px-6 py-5 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Clienti</h1>
        {selectMode ? (
          <div className="flex items-center gap-2">
            <span className="text-dim text-sm hidden sm:block">{selected.size} selezionat{selected.size === 1 ? 'o' : 'i'}</span>
            <button
              onClick={() => setShowMerge(true)}
              disabled={selected.size < 2}
              className="text-sm bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-30"
            >
              Unisci
            </button>
            <button onClick={exitSelect} className="text-sm bg-surface2 hover:bg-slate text-muted hover:text-text font-medium px-4 py-2 rounded-lg transition-colors">
              Annulla
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {clienti.length >= 2 && (
              <button
                onClick={() => setSelectMode(true)}
                className="text-sm bg-surface2 hover:bg-slate text-muted hover:text-text font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Unisci
              </button>
            )}
            <button
              onClick={() => setShowImport(true)}
              className="text-sm bg-surface2 hover:bg-slate text-muted hover:text-text font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Importa da accettati
              {candidati.length > 0 && (
                <span className="ml-2 text-xs bg-accent text-white rounded-full px-1.5 py-0.5">{candidati.length}</span>
              )}
            </button>
            <button
              onClick={() => { setForm(FORM_DEFAULT); setErrore(''); setShowNew(true); }}
              className="text-sm bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
            >
              + Nuovo cliente
            </button>
          </div>
        )}
      </header>

      <div className="px-6 py-6 max-w-6xl mx-auto flex flex-col gap-6">
        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'CLIENTI', value: String(clienti.length), color: 'text-text' },
            { label: 'CONTRATTUALIZZATO', value: fmt(totali.totale), color: 'text-text' },
            { label: 'RICEVUTO', value: fmt(totali.ricevuto), color: 'text-green-400' },
            { label: 'DA RICEVERE', value: fmt(totali.daDare), color: 'text-amber-400' },
          ].map((k) => (
            <div key={k.label} className="bg-surface border border-edge rounded-xl p-5">
              <p className="text-dim text-xs font-medium mb-3">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Griglia clienti */}
        {clienti.length === 0 ? (
          <div className="text-center py-20 text-dim">
            <p className="font-medium">Nessun cliente</p>
            <p className="text-sm mt-1">Creane uno nuovo o importalo dallo storico dei preventivi accettati</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {clienti.map((c) => {
              const f = calcFinanza(prevByCliente.get(c.id) ?? []);
              const isSel = selected.has(c.id);
              const inner = (
                <>
                  <div className="mb-3 flex items-start gap-2">
                    {selectMode && (
                      <span className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center text-[10px] ${isSel ? 'bg-accent border-accent text-white' : 'border-edge text-transparent'}`}>✓</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-text font-semibold truncate">{c.nome}</p>
                      {c.azienda && c.azienda !== c.nome && (
                        <p className="text-muted text-sm truncate">{c.azienda}</p>
                      )}
                      <p className="text-dim text-xs mt-1">Cliente dal {fmtData(c.data_inizio)}</p>
                    </div>
                  </div>
                  <div className="border-t border-edge/60 pt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-dim">Totale</span>
                      <span className="text-text font-medium">{fmt(f.totale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dim">Ricevuti</span>
                      <span className="text-green-400 font-medium">{fmt(f.ricevuto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-dim">Da ricevere</span>
                      <span className="text-amber-400 font-medium">{fmt(f.daDare)}</span>
                    </div>
                  </div>
                </>
              );
              return selectMode ? (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleSel(c.id)}
                  className={`text-left bg-surface border rounded-xl p-5 transition-colors block w-full ${isSel ? 'border-accent' : 'border-edge hover:border-slate'}`}
                >
                  {inner}
                </button>
              ) : (
                <Link
                  key={c.id}
                  href={`/preventivi/clienti/${c.id}`}
                  className="bg-surface border border-edge rounded-xl p-5 hover:border-slate transition-colors block"
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Nuovo cliente */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-surface border border-edge rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-text font-semibold">Nuovo cliente</h2>
              <button onClick={() => setShowNew(false)} className="text-dim hover:text-text transition-colors">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-dim text-xs font-medium block mb-1">NOME *</label>
                <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome cliente o referente" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">AZIENDA</label>
                  <input type="text" value={form.azienda} onChange={(e) => set('azienda', e.target.value)} placeholder="Ragione sociale" className={inputCls} />
                </div>
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">INIZIO RAPPORTO</label>
                  <input type="date" value={form.data_inizio} onChange={(e) => set('data_inizio', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-dim text-xs font-medium block mb-1">EMAIL</label>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@cliente.it" className={inputCls} />
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
                <input type="text" value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Opzionale" className={inputCls} />
              </div>
              {errore && <p className="text-red-400 text-xs font-mono">⚠ {errore}</p>}
              <div className="flex gap-2 mt-1">
                <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors">Annulla</button>
                <button onClick={salvaNuovo} disabled={loading} className="flex-1 py-2.5 text-sm bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-30">
                  {loading ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importa da accettati */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-surface border border-edge rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-text font-semibold">Importa dallo storico</h2>
              <button onClick={() => setShowImport(false)} className="text-dim hover:text-text transition-colors">✕</button>
            </div>
            <p className="text-dim text-xs mb-5">Clienti dei preventivi accettati non ancora presenti in anagrafica.</p>
            {candidati.length === 0 ? (
              <div className="text-center py-12 text-dim text-sm">Nessun cliente da importare.</div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
                {candidati.map((c) => {
                  const key = c.email || `__id${c.ids[0]}`;
                  return (
                    <div key={key} className="flex items-center justify-between gap-3 bg-surface2 rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-text text-sm font-medium truncate">{c.nome}</p>
                        <p className="text-dim text-xs truncate">
                          {c.email || 'senza email'} · {c.ids.length} preventiv{c.ids.length === 1 ? 'o' : 'i'} · {fmt(c.totale)}
                        </p>
                      </div>
                      <button
                        onClick={() => importa(c)}
                        disabled={busyKey === key}
                        className="shrink-0 text-xs px-3 py-1.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-30"
                      >
                        {busyKey === key ? '...' : 'Aggiungi'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => setShowImport(false)} className="w-full mt-5 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors">
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Modal unisci selezionati: scegli il cliente da tenere */}
      {showMerge && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
          <div className="bg-surface border border-edge rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-text font-semibold">Unisci clienti</h2>
              <button onClick={() => setShowMerge(false)} className="text-dim hover:text-text transition-colors">✕</button>
            </div>
            <p className="text-dim text-xs mb-5">
              Scegli il cliente da <span className="text-text font-medium">tenere</span>: gli altri {selezionati.length - 1} verranno assorbiti in esso (preventivi trasferiti, dati mancanti ereditati) ed eliminati.
            </p>
            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {selezionati.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 bg-surface2 rounded-xl px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-text text-sm font-medium truncate">{c.nome}</p>
                    <p className="text-dim text-xs truncate">{c.azienda || c.email || 'nessun dato'}</p>
                  </div>
                  <button
                    onClick={() => eseguiMerge(c.id)}
                    disabled={merging}
                    className="shrink-0 text-xs px-3 py-1.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-30"
                  >
                    {merging ? '...' : 'Tieni questo'}
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowMerge(false)} className="w-full mt-5 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors">
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
