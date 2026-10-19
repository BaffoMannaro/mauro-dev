'use client';

import { useState } from 'react';

/** Oggi nel fuso del browser, YYYY-MM-DD. */
const oggiLocale = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Conferma del cambio di stato di una fattura, contro i tocchi per sbaglio.
 * Segnandola pagata si sceglie il giorno dell'incasso (default oggi): fa fede per incassi e tasse.
 */
export default function ConfermaPagamento({
  descrizione,
  verso,
  onConferma,
  onAnnulla,
}: {
  /** Es. "Fattura n. 12 · Centro Medico New Life · €5.120,00" */
  descrizione: string;
  verso: 'pagata' | 'da_pagare';
  onConferma: (pagataIl: string | null) => void;
  onAnnulla: () => void;
}) {
  const [giorno, setGiorno] = useState(oggiLocale);
  const pagata = verso === 'pagata';

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" onClick={onAnnulla}>
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface border border-edge rounded-2xl w-full max-w-sm p-5 sm:p-6 flex flex-col gap-4 anima-comparsa"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="text-text font-semibold">{pagata ? 'Segnare come pagata?' : 'Riportare a "da pagare"?'}</h2>
          <p className="text-dim text-sm mt-1">{descrizione}</p>
        </div>
        {pagata ? (
          <label className="flex flex-col gap-1">
            <span className="text-dim text-xs font-medium">GIORNO DELL’INCASSO</span>
            <input
              type="date"
              value={giorno}
              max={oggiLocale()}
              onChange={(e) => setGiorno(e.target.value)}
              className="w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-slate"
            />
            <span className="text-dim text-xs">Fa fede per incassi e tasse (principio di cassa).</span>
          </label>
        ) : (
          <p className="text-muted text-sm">La data dell’incasso verrà cancellata e l’importo tornerà tra quelli da incassare.</p>
        )}
        <div className="flex gap-2">
          <button onClick={onAnnulla} className="flex-1 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors cursor-pointer">
            Annulla
          </button>
          <button
            onClick={() => onConferma(pagata ? giorno || oggiLocale() : null)}
            className="flex-1 py-2.5 text-sm bg-accent text-on-accent font-semibold rounded-xl hover:bg-accent/90 transition-colors cursor-pointer"
          >
            {pagata ? 'Conferma incasso' : 'Conferma'}
          </button>
        </div>
      </div>
    </div>
  );
}
