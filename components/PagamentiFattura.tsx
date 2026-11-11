'use client';

import { useEffect, useState } from 'react';
import { euroCent as eur } from '@/lib/formato';
import type { StatoPagamenti } from '@/lib/fattura/server';

/** Oggi nel fuso del browser, YYYY-MM-DD. */
const oggiLocale = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const it = (iso: string) => iso.split('-').reverse().join('/');
const METODI = ['Bonifico', 'Contanti', 'Carta', 'PayPal', 'Assegno'];

const inputCls =
  'w-full bg-bg border border-edge rounded-lg px-2.5 py-1.5 text-sm text-text placeholder-dim focus:outline-none focus:border-slate';

/**
 * Pagamenti di una fattura (anche parziali): barra incassato/residuo, elenco con eliminazione
 * (con conferma) e form "Registra pagamento" con importo = residuo e data = oggi.
 * Stato e giorno del saldo derivano dai pagamenti; ogni incasso conta alla sua data.
 */
export default function PagamentiFattura({
  fatturaId,
  onCambio,
}: {
  fatturaId: number;
  /** Chiamata dopo ogni registrazione/eliminazione con lo stato aggiornato. */
  onCambio?: (s: StatoPagamenti) => void;
}) {
  const [s, setS] = useState<StatoPagamenti | null>(null);
  const [errore, setErrore] = useState('');
  const [busy, setBusy] = useState(false);
  const [importo, setImporto] = useState('');
  const [data, setData] = useState(oggiLocale);
  const [metodo, setMetodo] = useState('Bonifico');
  const [nota, setNota] = useState('');

  const applica = (nuovo: StatoPagamenti, avvisa: boolean) => {
    setS(nuovo);
    setImporto(nuovo.residuo > 0 ? nuovo.residuo.toFixed(2) : '');
    if (avvisa) onCambio?.(nuovo);
  };

  useEffect(() => {
    // Una fattura per istanza: chi lo usa cambia `key` quando cambia fattura.
    let annullato = false;
    fetch(`/api/fatture/${fatturaId}/pagamenti`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error || 'Errore'))))
      .then((x: StatoPagamenti) => !annullato && applica(x, false))
      .catch((e) => !annullato && setErrore(`Pagamenti non caricati: ${e.message}`));
    return () => { annullato = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fatturaId]);

  const registra = async () => {
    setErrore('');
    setBusy(true);
    const res = await fetch(`/api/fatture/${fatturaId}/pagamenti`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importo: Number(importo.replace(',', '.')), data, metodo, nota }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErrore(body.error || 'Registrazione non riuscita');
    setNota('');
    applica(body, true);
  };

  const elimina = async (p: StatoPagamenti['pagamenti'][number]) => {
    if (!confirm(`Eliminare il pagamento di ${eur(p.importo)} del ${it(p.data)}? Incassato, stato e tasse si ricalcolano.`)) return;
    setErrore('');
    setBusy(true);
    const res = await fetch(`/api/fatture/${fatturaId}/pagamenti/${p.id}`, { method: 'DELETE' });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErrore(body.error || 'Eliminazione non riuscita');
    applica(body, true);
  };

  if (!s) {
    return (
      <div className="bg-surface border border-edge rounded-xl p-4 mb-3">
        <p className="text-dim text-xs font-medium">PAGAMENTI</p>
        <p className={`text-sm mt-2 ${errore ? 'text-red-400' : 'text-dim'}`}>{errore || 'Caricamento…'}</p>
      </div>
    );
  }

  const quota = s.totale > 0 ? Math.min(100, (s.incassato / s.totale) * 100) : 0;
  const colore = s.stato === 'pagata' ? 'text-green-400' : s.stato === 'parziale' ? 'text-sky-400' : 'text-amber-400';
  const valore = Number(importo.replace(',', '.'));
  const valido = valore > 0 && valore <= s.residuo + 0.001 && /^\d{4}-\d{2}-\d{2}$/.test(data);

  return (
    <div className="bg-surface border border-edge rounded-xl p-4 mb-3 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-dim text-xs font-medium">PAGAMENTI</p>
        <p className={`text-xs font-medium ${colore}`}>
          {s.stato === 'pagata'
            ? `Pagata${s.pagata_il ? ` il ${it(s.pagata_il)}` : ''}`
            : s.stato === 'parziale' ? 'Pagata in parte' : 'Da pagare'}
        </p>
      </div>

      <div>
        <div
          className="h-2 bg-surface2 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(quota)}
          aria-label="Quota incassata"
        >
          <div className={`h-full rounded-full ${s.stato === 'pagata' ? 'bg-green-400' : 'bg-accent'}`} style={{ width: `${quota}%` }} />
        </div>
        <div className="flex justify-between gap-3 text-xs mt-1.5">
          <span className="text-muted">Incassati <span className="text-text font-medium">{eur(s.incassato)}</span> su {eur(s.totale)}</span>
          <span className={s.residuo > 0 ? 'text-amber-400' : 'text-dim'}>Residuo {eur(s.residuo)}</span>
        </div>
      </div>

      {s.pagamenti.length > 0 && (
        <ul className="flex flex-col divide-y divide-edge/60 border border-edge/60 rounded-lg">
          {s.pagamenti.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="text-dim tabular-nums w-20 shrink-0">{it(p.data)}</span>
              <span className="min-w-0 flex-1 truncate text-muted" title={p.nota ?? undefined}>
                {[p.metodo, p.nota].filter(Boolean).join(' · ') || '—'}
              </span>
              <span className="font-medium tabular-nums shrink-0">{eur(p.importo)}</span>
              <button
                onClick={() => elimina(p)}
                disabled={busy}
                title="Elimina pagamento"
                aria-label={`Elimina pagamento del ${it(p.data)}`}
                className="text-dim hover:text-red-400 transition-colors disabled:opacity-30 cursor-pointer px-1"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {s.residuo > 0 && (
        <form
          className="grid grid-cols-2 gap-2"
          onSubmit={(e) => { e.preventDefault(); if (valido && !busy) registra(); }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-dim text-xs font-medium">IMPORTO €</span>
            <input type="number" step="0.01" min="0.01" max={s.residuo} value={importo} onChange={(e) => setImporto(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-dim text-xs font-medium">DATA</span>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={inputCls} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-dim text-xs font-medium">METODO</span>
            <input list="metodi-pagamento" value={metodo} onChange={(e) => setMetodo(e.target.value)} className={inputCls} />
            <datalist id="metodi-pagamento">{METODI.map((m) => <option key={m} value={m} />)}</datalist>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-dim text-xs font-medium">NOTA</span>
            <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="es. 2ª rata" className={inputCls} />
          </label>
          <button
            type="submit"
            disabled={!valido || busy}
            className="col-span-2 py-2 text-sm bg-accent text-on-accent font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-40 cursor-pointer"
          >
            {busy ? 'Salvataggio…' : 'Registra pagamento'}
          </button>
          <p className="col-span-2 text-dim text-xs">Ogni pagamento conta per incassi e tasse alla sua data.</p>
        </form>
      )}

      {errore && <p className="text-red-400 text-xs">{errore}</p>}
    </div>
  );
}
