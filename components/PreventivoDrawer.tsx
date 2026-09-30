'use client';

import { useState, useEffect } from 'react';

interface Preventivo {
  id: number;
  token: string;
  cliente_nome: string;
  cliente_azienda: string | null;
  cliente_email: string;
  oggetto: string;
  voci: any[];
  note: string | null;
  scadenza: string | null;
  totale: number;
  iva: boolean;
  stato: string;
  accettato_at: string | null;
  accettato_ip: string | null;
  accettato_ua: string | null;
  accettato_nome: string | null;
  accettato_cognome: string | null;
  accettato_email: string | null;
  tranches_stato: { descrizione: string; percentuale: number; pagato: boolean }[] | null;
  lavoro_inizio: string | null;
  lavoro_fine: string | null;
  created_at: string;
  conferma_email_at?: string | null;
  conferma_email_errore?: string | null;
  meta?: any;
}

interface FattureCollegate {
  fatture: { id: number; numero: string | null; data: string | null; importo: number; stato: string; intestatario: string | null; piva: string | null }[];
  riepilogo: { totale_preventivo: number; fatturato: number; incassato: number; da_fatturare: number; da_incassare: number; societa: string[] };
}

interface VisiteLink {
  riepilogo: { aperture: number; dispositivi: number; prima: string | null; ultima: string | null; tempo_totale_s: number; pdf_scaricati: number; sezioni_lette: string[] };
  visite: { id: number; iniziata_at: string; durata_s: number; sezioni: string[]; pdf: boolean; dispositivo: string | null; browser: string | null; sistema: string | null; citta: string | null; paese: string | null }[];
}

const durata = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`);
const quando = (iso: string) => new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const euro = (n: number) => `€${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

export default function PreventivoDrawer({
  preventivo,
  onClose,
  onUpdate,
}: {
  preventivo: Preventivo;
  onClose: () => void;
  onUpdate: (p: Preventivo) => void;
}) {
  const totale = Number(preventivo.totale);
  const metaTranches = preventivo.meta?.sezioni?.tranches || [];

  const tranches: { descrizione: string; percentuale: number; pagato: boolean; data_pagamento?: string }[] =
    preventivo.tranches_stato && preventivo.tranches_stato.length > 0
      ? preventivo.tranches_stato
      : metaTranches.length > 0
        ? metaTranches.map((t: any) => ({ ...t, pagato: false }))
        : [{ descrizione: 'Pagamento unico', percentuale: 100, pagato: false }];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const [tranchesLocali, setTranchesLocali] = useState(tranches);
  const [inizio, setInizio] = useState(preventivo.lavoro_inizio ? new Date(preventivo.lavoro_inizio).toISOString().slice(0, 10) : '');
  const [fine, setFine] = useState(preventivo.lavoro_fine ? new Date(preventivo.lavoro_fine).toISOString().slice(0, 10) : '');
  const [salvato, setSalvato] = useState(false);

  // Fatture collegate (dalla sezione Fatture o da Claude): le società vengono da lì.
  const [fatture, setFatture] = useState<FattureCollegate | null>(null);
  const [visite, setVisite] = useState<VisiteLink | null>(null);
  useEffect(() => {
    let attivo = true;
    fetch(`/api/preventivi/${preventivo.id}/visite`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (attivo) setVisite(d); })
      .catch(() => {});
    return () => { attivo = false; };
  }, [preventivo.id]);
  useEffect(() => {
    let attivo = true;
    fetch(`/api/preventivi/${preventivo.id}/fatture`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (attivo) setFatture(d); })
      .catch(() => {});
    return () => { attivo = false; };
  }, [preventivo.id]);

  const toggleTranche = (i: number) => {
    setTranchesLocali((prev) =>
      prev.map((t, idx) => {
        if (idx !== i) return t;
        const nuovoPagato = !t.pagato;
        return {
          ...t,
          pagato: nuovoPagato,
          data_pagamento: nuovoPagato
            ? (t.data_pagamento || new Date().toISOString().slice(0, 10))
            : '',
        };
      })
    );
    setSalvato(false);
  };

  const aggiornaTranche = (i: number, data: string) => {
    setTranchesLocali((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, data_pagamento: data } : t))
    );
    setSalvato(false);
  };

  const salva = async () => {
    const res = await fetch(`/api/preventivi/${preventivo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tranches_stato: tranchesLocali,
        lavoro_inizio: inizio || null,
        lavoro_fine: fine || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onUpdate(data);
      setSalvato(true);
      setTimeout(() => setSalvato(false), 2000);
    }
  };

  const inputCls = "w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-slate";

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-edge z-50 overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge sticky top-0 bg-surface">
          <div>
            <p className="text-text font-medium">{preventivo.oggetto}</p>
            <p className="text-dim text-xs">
              {preventivo.cliente_nome}
              {preventivo.cliente_azienda && preventivo.cliente_azienda !== preventivo.cliente_nome && ` · ${preventivo.cliente_azienda}`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-xl transition-colors cursor-pointer">✕</button>
        </div>

        <div className="flex-1 px-6 py-6 flex flex-col gap-6">

          {/* Accettazione */}
          {preventivo.stato === 'accettato' && (
            <div>
              <p className="text-dim text-xs font-mono mb-3">ACCETTAZIONE</p>
              <div className="bg-surface2 rounded-xl p-4 flex flex-col gap-2">
                {preventivo.accettato_nome && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Nome</span>
                    <span className="text-text">{preventivo.accettato_nome} {preventivo.accettato_cognome}</span>
                  </div>
                )}
                {preventivo.accettato_email && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Email</span>
                    <span className="text-text">{preventivo.accettato_email}</span>
                  </div>
                )}
                {preventivo.accettato_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Data</span>
                    <span className="text-text">{new Date(preventivo.accettato_at).toLocaleString('it-IT')}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-muted shrink-0">Email conferma</span>
                  {preventivo.conferma_email_at ? (
                    <span className="text-green-400 text-right">Inviata {new Date(preventivo.conferma_email_at).toLocaleString('it-IT')}</span>
                  ) : preventivo.conferma_email_errore ? (
                    <span className="text-red-400 text-xs text-right break-all">{preventivo.conferma_email_errore}</span>
                  ) : (
                    <span className="text-dim">—</span>
                  )}
                </div>
                {preventivo.accettato_ip && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">IP</span>
                    <span className="text-text font-mono text-xs">{preventivo.accettato_ip}</span>
                  </div>
                )}
                {preventivo.accettato_ua && (
                  <div className="flex flex-col gap-1 text-sm">
                    <span className="text-muted">Browser</span>
                    <span className="text-dim text-xs break-all">{preventivo.accettato_ua}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tranches */}
          {tranchesLocali.length > 0 && (
            <div>
              <p className="text-dim text-xs font-mono mb-3">PAGAMENTI</p>
              <div className="flex flex-col gap-2">
                {tranchesLocali.map((t, i) => (
                  <div
                    key={i}
                    className={`flex flex-col p-4 rounded-xl border transition-colors ${
                      t.pagato
                        ? 'bg-green-950/30 border-green-800'
                        : 'bg-surface2 border-edge'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={t.pagato}
                          onChange={() => toggleTranche(i)}
                          className="accent-green-400 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <p className={`text-sm font-medium ${t.pagato ? 'text-green-400' : 'text-text'}`}>
                            {t.descrizione}
                          </p>
                          <p className="text-muted text-xs">
                            {`€${Math.round(totale * t.percentuale / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
                          </p>
                        </div>
                      </div>
                      {t.pagato && <span className="text-green-400 text-xs font-mono">✓ Pagato</span>}
                    </div>
                    {t.pagato && (
                      <div className="mt-3 flex items-center gap-2">
                        <label className="text-dim text-xs font-mono shrink-0">DATA PAGAMENTO</label>
                        <input
                          type="date"
                          value={t.data_pagamento || ''}
                          onChange={(e) => aggiornaTranche(i, e.target.value)}
                          className="flex-1 bg-bg border border-edge rounded-lg px-2 py-1 text-xs text-text focus:outline-none focus:border-slate"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Aperture del link pubblico */}
          {visite && (
            <div>
              <p className="text-dim text-xs font-mono mb-3">APERTURE DEL LINK</p>
              {visite.riepilogo.aperture === 0 ? (
                <p className="text-dim text-sm">Il cliente non ha ancora aperto il preventivo.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { k: 'Aperture', v: String(visite.riepilogo.aperture) },
                      { k: 'Tempo totale', v: durata(visite.riepilogo.tempo_totale_s) },
                      { k: 'PDF scaricato', v: visite.riepilogo.pdf_scaricati ? `${visite.riepilogo.pdf_scaricati}×` : 'No' },
                    ].map((x) => (
                      <div key={x.k} className="bg-surface2 rounded-xl p-3">
                        <p className="text-dim text-xs">{x.k}</p>
                        <p className="text-text text-sm font-semibold mt-0.5">{x.v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-dim text-xs">
                    Prima apertura {quando(visite.riepilogo.prima!)} · ultima {quando(visite.riepilogo.ultima!)}
                    {visite.riepilogo.dispositivi > 1 && ` · da ${visite.riepilogo.dispositivi} dispositivi diversi`}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {visite.visite.slice(0, 8).map((v) => (
                      <div key={v.id} className="bg-surface2 rounded-xl px-4 py-2.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-text">{quando(v.iniziata_at)}</span>
                          <span className="text-muted text-xs">{durata(v.durata_s)}{v.pdf && ' · PDF'}</span>
                        </div>
                        <p className="text-dim text-xs mt-0.5 truncate">
                          {[v.dispositivo, v.sistema, v.browser].filter(Boolean).join(' · ')}
                          {v.citta && ` · ${v.citta}`}
                          {v.sezioni.length > 0 && ` · ha aperto: ${v.sezioni.join(', ')}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fatture collegate */}
          {fatture && (
            <div>
              <p className="text-dim text-xs font-mono mb-3">FATTURE</p>
              {fatture.fatture.length === 0 ? (
                <p className="text-dim text-sm">Nessuna fattura collegata. Collegala dalla sezione Fatture o chiedilo a Claude.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { k: 'Fatturato', v: fatture.riepilogo.fatturato },
                      { k: 'Incassato', v: fatture.riepilogo.incassato },
                      { k: 'Da fatturare', v: fatture.riepilogo.da_fatturare },
                    ].map((x) => (
                      <div key={x.k} className="bg-surface2 rounded-xl p-3">
                        <p className="text-dim text-xs">{x.k}</p>
                        <p className="text-text text-sm font-semibold mt-0.5">{euro(x.v)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-1.5 bg-surface2 rounded-full overflow-hidden flex">
                    <div className="h-full bg-accent" style={{ width: `${Math.min(100, (fatture.riepilogo.incassato / (fatture.riepilogo.totale_preventivo || 1)) * 100)}%` }} />
                    <div className="h-full bg-muted" style={{ width: `${Math.min(100, (fatture.riepilogo.da_incassare / (fatture.riepilogo.totale_preventivo || 1)) * 100)}%` }} />
                  </div>
                  {fatture.fatture.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-3 bg-surface2 rounded-xl px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-text text-sm font-medium truncate">{f.intestatario ?? '—'}</p>
                        <p className="text-dim text-xs">
                          n. {f.numero ?? '—'}{f.data && ` · ${f.data.split('-').reverse().join('/')}`}{f.piva && ` · ${f.piva}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-text text-sm font-semibold">{euro(f.importo)}</p>
                        <p className={`text-xs ${f.stato === 'pagata' ? 'text-green-400' : 'text-amber-400'}`}>
                          {f.stato === 'pagata' ? 'Pagata' : 'Da pagare'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date lavoro */}
          <div>
            <p className="text-dim text-xs font-mono mb-3">PERIODO DI LAVORO</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-dim text-xs block mb-1">Inizio</label>
                <input type="date" value={inizio}
                  onChange={(e) => { setInizio(e.target.value); setSalvato(false); }}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-dim text-xs block mb-1">Fine</label>
                <input type="date" value={fine}
                  onChange={(e) => { setFine(e.target.value); setSalvato(false); }}
                  className={inputCls} />
              </div>
            </div>
          </div>

          {/* Salva */}
          <button
            onClick={salva}
            className="w-full bg-accent text-on-accent font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors cursor-pointer"
          >
            {salvato ? '✓ Salvato!' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </>
  );
}
