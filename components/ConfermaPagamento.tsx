'use client';

import { useState } from 'react';

/** Oggi nel fuso del browser, YYYY-MM-DD. */
const oggiLocale = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const it = (iso: string) => iso.split('-').reverse().join('/');

/**
 * Finestra per il pagamento di una fattura, contro i tocchi per sbaglio.
 * - Da pagare → pagata: si sceglie il giorno dell'incasso (oggi, data fattura o un giorno a scelta).
 * - Già pagata: si corregge il giorno dell'incasso oppure la si riporta a "da pagare".
 * Il giorno dell'incasso fa fede per incassi e tasse.
 */
export default function ConfermaPagamento({
  descrizione,
  stato,
  pagataIl,
  dataFattura,
  onConferma,
  onAnnulla,
}: {
  /** Es. "Fattura n. 12 · Centro Medico New Life · €5.120,00" */
  descrizione: string;
  stato: string;
  pagataIl?: string | null;
  dataFattura?: string | null;
  onConferma: (stato: 'pagata' | 'da_pagare', pagataIl: string | null) => void;
  onAnnulla: () => void;
}) {
  const giaPagata = stato === 'pagata';
  const oggi = oggiLocale();
  const fattura = dataFattura ? dataFattura.slice(0, 10) : null;
  const [giorno, setGiorno] = useState(() => (pagataIl ? pagataIl.slice(0, 10) : oggi));
  const valido = /^\d{4}-\d{2}-\d{2}$/.test(giorno) && giorno <= oggi;

  const scorciatoia = (label: string, valore: string) => (
    <button
      type="button"
      onClick={() => setGiorno(valore)}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
        giorno === valore ? 'bg-accent text-on-accent border-accent' : 'bg-surface2 text-muted border-edge hover:text-text'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0" onClick={onAnnulla}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titolo-pagamento"
        className="bg-surface border border-edge rounded-2xl w-full max-w-sm p-5 sm:p-6 flex flex-col gap-4 anima-comparsa"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="titolo-pagamento" className="text-text font-semibold">
              {giaPagata ? 'Fattura pagata' : 'Segnare come pagata?'}
            </h2>
            <p className="text-dim text-sm mt-1">{descrizione}</p>
          </div>
          <button onClick={onAnnulla} aria-label="Chiudi" className="text-dim hover:text-text transition-colors cursor-pointer">✕</button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-dim text-xs font-medium">GIORNO DELL’INCASSO</span>
          <div className="flex flex-wrap gap-2">
            {scorciatoia('Oggi', oggi)}
            {fattura && fattura <= oggi && scorciatoia(`Data fattura ${it(fattura)}`, fattura)}
          </div>
          <input
            type="date"
            value={giorno}
            max={oggi}
            onChange={(e) => setGiorno(e.target.value)}
            aria-label="Giorno dell'incasso"
            className="w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-slate"
          />
          <span className={`text-xs ${valido ? 'text-dim' : 'text-red-400'}`}>
            {valido ? 'Fa fede per incassi e tasse (principio di cassa).' : 'Scegli un giorno valido, non nel futuro.'}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button onClick={onAnnulla} className="flex-1 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors cursor-pointer">
              Annulla
            </button>
            <button
              onClick={() => onConferma('pagata', giorno)}
              disabled={!valido || (giaPagata && giorno === pagataIl?.slice(0, 10))}
              className="flex-1 py-2.5 text-sm bg-accent text-on-accent font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40 cursor-pointer"
            >
              {giaPagata ? 'Salva data' : 'Conferma incasso'}
            </button>
          </div>
          {giaPagata && (
            <button
              onClick={() => onConferma('da_pagare', null)}
              className="py-2 text-sm text-amber-400 hover:bg-amber-950/30 rounded-xl transition-colors cursor-pointer"
            >
              Riporta a “da pagare”
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
