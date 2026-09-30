'use client';

import { useMemo, useState } from 'react';
import type { Fattura } from '@/lib/fattura/parse';
import { eur } from '@/lib/fattura/html';
import { suggerisciPreventivi, type PreventivoCollegabile } from '@/lib/fattura/collegamenti';
import type { FatturaSalvata } from './FattureDashboard';

// Pannello sopra l'anteprima: società intestataria (dati dalla fattura) e preventivo collegato.
export default function FatturaCollegamento({
  riga,
  fattura,
  preventivi,
  onCollega,
}: {
  riga: FatturaSalvata;
  fattura: Fattura;
  preventivi: PreventivoCollegabile[];
  onCollega: (preventivoId: number | null) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const c = fattura.committente;

  const suggeriti = useMemo(
    () => suggerisciPreventivi({ ...riga, cliente_piva: riga.cliente_piva }, preventivi, 4),
    [riga, preventivi]
  );
  const idSuggeriti = new Set(suggeriti.map((s) => s.id));
  const altri = preventivi.filter((p) => !idSuggeriti.has(p.id) && p.stato !== 'rifiutato');
  const collegato = preventivi.find((p) => p.id === riga.preventivo_id);

  const cambia = async (v: string) => {
    setBusy(true);
    await onCollega(v === '' ? null : Number(v));
    setBusy(false);
  };

  const label = (p: { oggetto: string; cliente_azienda?: string | null; cliente_nome?: string; cliente?: string; totale: number }) =>
    `${p.cliente ?? p.cliente_azienda ?? p.cliente_nome} — ${p.oggetto} (${eur(p.totale)})`;

  return (
    <div className="bg-surface border border-edge rounded-xl mb-4 grid sm:grid-cols-2 overflow-hidden">
      <div className="p-4 sm:border-r border-b sm:border-b-0 border-edge min-w-0">
        <p className="text-dim text-xs font-medium mb-2">SOCIETÀ INTESTATARIA</p>
        <p className="text-sm font-semibold truncate">{c.nome}</p>
        <p className="text-muted text-xs mt-1">
          {[c.piva && `P.IVA ${c.piva}`, c.cf && c.cf !== c.piva?.slice(2) && `C.F. ${c.cf}`].filter(Boolean).join(' · ')}
        </p>
        {(c.indirizzo || c.localita) && <p className="text-dim text-xs mt-0.5 truncate">{[c.indirizzo, c.localita].filter(Boolean).join(', ')}</p>}
        {(fattura.codiceDestinatario || fattura.pecDestinatario) && (
          <p className="text-dim text-xs mt-0.5 truncate">
            {fattura.codiceDestinatario ? `SDI ${fattura.codiceDestinatario}` : `PEC ${fattura.pecDestinatario}`}
          </p>
        )}
      </div>

      <div className="p-4 min-w-0">
        <p className="text-dim text-xs font-medium mb-2">PREVENTIVO</p>
        <select
          value={riga.preventivo_id ?? ''}
          disabled={busy}
          onChange={(e) => cambia(e.target.value)}
          className="w-full bg-bg border border-edge rounded-lg px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-slate disabled:opacity-50"
        >
          <option value="">— Nessun preventivo —</option>
          {suggeriti.length > 0 && (
            <optgroup label="Suggeriti">
              {suggeriti.map((s) => (
                <option key={s.id} value={s.id}>★ {label(s)} · {s.motivi.join(', ')}</option>
              ))}
            </optgroup>
          )}
          <optgroup label="Tutti">
            {altri.map((p) => (
              <option key={p.id} value={p.id}>{label(p)}</option>
            ))}
          </optgroup>
        </select>
        {collegato ? (
          <p className="text-dim text-xs mt-2">
            Fatturato {eur(collegato.fatturato)} di {eur(collegato.totale)}
            {collegato.totale - collegato.fatturato > 1 && <> · da fatturare <span className="text-text">{eur(collegato.totale - collegato.fatturato)}</span></>}
            <br />La società del preventivo viene aggiornata da questa fattura.
          </p>
        ) : (
          suggeriti[0] && (
            <button
              onClick={() => cambia(String(suggeriti[0].id))}
              disabled={busy}
              className="text-xs text-accent hover:underline mt-2 cursor-pointer disabled:opacity-50"
            >
              Collega a “{suggeriti[0].oggetto}”
            </button>
          )
        )}
      </div>
    </div>
  );
}
