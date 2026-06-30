'use client';

import { useState } from 'react';

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
  meta?: any;
}

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

  const [tranchesLocali, setTranchesLocali] = useState(tranches);
  const [inizio, setInizio] = useState(preventivo.lavoro_inizio ? new Date(preventivo.lavoro_inizio).toISOString().slice(0, 10) : '');
  const [fine, setFine] = useState(preventivo.lavoro_fine ? new Date(preventivo.lavoro_fine).toISOString().slice(0, 10) : '');
  const [salvato, setSalvato] = useState(false);

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

  const inputCls = "w-full bg-surface border border-edge rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-slate";

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-edge z-50 overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge sticky top-0 bg-surface">
          <div>
            <p className="text-white font-medium">{preventivo.oggetto}</p>
            <p className="text-dim text-xs">{preventivo.cliente_nome}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white text-xl transition-colors">✕</button>
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
                    <span className="text-white">{preventivo.accettato_nome} {preventivo.accettato_cognome}</span>
                  </div>
                )}
                {preventivo.accettato_email && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Email</span>
                    <span className="text-white">{preventivo.accettato_email}</span>
                  </div>
                )}
                {preventivo.accettato_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Data</span>
                    <span className="text-white">{new Date(preventivo.accettato_at).toLocaleString('it-IT')}</span>
                  </div>
                )}
                {preventivo.accettato_ip && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">IP</span>
                    <span className="text-white font-mono text-xs">{preventivo.accettato_ip}</span>
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
                          <p className={`text-sm font-medium ${t.pagato ? 'text-green-400' : 'text-white'}`}>
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
                          className="flex-1 bg-bg border border-edge rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-slate"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
            className="w-full bg-accent text-white font-semibold py-3 rounded-xl hover:bg-accent/90 transition-colors"
          >
            {salvato ? '✓ Salvato!' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </>
  );
}
