'use client';

import { useState } from 'react';

interface Voce {
  descrizione: string;
  quantita: number;
  prezzo: number;
}

interface Preventivo {
  id: number;
  token: string;
  cliente_nome: string;
  cliente_azienda: string | null;
  cliente_email: string;
  oggetto: string;
  voci: Voce[];
  note: string | null;
  scadenza: string | null;
  totale: number;
  iva: boolean;
  stato: string;
  created_at: string;
}

export default function PreventivoCliente({ preventivo }: { preventivo: Preventivo }) {
  const [accettato, setAccettato] = useState(preventivo.stato === 'accettato');
  const [loading, setLoading] = useState(false);
  const [confermato, setConfermato] = useState(false);
  const [checkbox, setCheckbox] = useState(false);

  const imponibile = Number(preventivo.totale);
  const iva = preventivo.iva ? imponibile * 0.22 : 0;
  const totaleFinale = imponibile + iva;

  const handleAccetta = async () => {
    if (!checkbox) return;
    setLoading(true);
    const res = await fetch(`/api/p/${preventivo.token}/accetta`, { method: 'POST' });
    if (res.ok) {
      setAccettato(true);
      setConfermato(true);
    }
    setLoading(false);
  };

  const handleStampa = () => window.print();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-5 flex items-center justify-between print:hidden">
        <span className="text-zinc-400 text-sm font-mono">maurodev.it</span>
        <button
          onClick={handleStampa}
          className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/>
          </svg>
          Scarica PDF
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Intestazione preventivo */}
        <div className="mb-10">
          <p className="text-zinc-500 text-sm font-mono mb-2">PREVENTIVO #{preventivo.id}</p>
          <h1 className="text-3xl font-semibold text-white mb-1">{preventivo.oggetto}</h1>
          <p className="text-zinc-400 text-sm">
            Emesso il {new Date(preventivo.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
            {preventivo.scadenza && (
              <> · Valido fino al {new Date(preventivo.scadenza).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</>
            )}
          </p>
        </div>

        {/* Destinatario */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <p className="text-zinc-500 text-xs font-mono mb-3">DESTINATARIO</p>
          <p className="text-white font-medium">{preventivo.cliente_nome}</p>
          {preventivo.cliente_azienda && <p className="text-zinc-400">{preventivo.cliente_azienda}</p>}
          <p className="text-zinc-400 text-sm">{preventivo.cliente_email}</p>
        </div>

        {/* Voci */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-12 px-6 py-3 border-b border-zinc-800">
            <span className="col-span-6 text-zinc-500 text-xs font-mono">DESCRIZIONE</span>
            <span className="col-span-2 text-zinc-500 text-xs font-mono text-center">QTÀ</span>
            <span className="col-span-2 text-zinc-500 text-xs font-mono text-right">PREZZO</span>
            <span className="col-span-2 text-zinc-500 text-xs font-mono text-right">TOTALE</span>
          </div>
          {preventivo.voci.map((voce, i) => (
            <div key={i} className="grid grid-cols-12 px-6 py-4 border-b border-zinc-800/50 last:border-0">
              <span className="col-span-6 text-white">{voce.descrizione}</span>
              <span className="col-span-2 text-zinc-400 text-center">{voce.quantita}</span>
              <span className="col-span-2 text-zinc-400 text-right">€{Number(voce.prezzo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
              <span className="col-span-2 text-white text-right">€{(voce.quantita * voce.prezzo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>

        {/* Totali */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between text-zinc-400 text-sm mb-2">
            <span>Imponibile</span>
            <span>€{imponibile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
          {preventivo.iva && (
            <div className="flex justify-between text-zinc-400 text-sm mb-3">
              <span>IVA 22%</span>
              <span>€{iva.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between text-white font-semibold text-lg border-t border-zinc-800 pt-3">
            <span>Totale</span>
            <span>€{totaleFinale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Note */}
        {preventivo.note && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <p className="text-zinc-500 text-xs font-mono mb-2">NOTE</p>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap">{preventivo.note}</p>
          </div>
        )}

        {/* Accettazione */}
        {!accettato ? (
          <div className="border border-zinc-700 rounded-xl p-6 print:hidden">
            <p className="text-zinc-500 text-xs font-mono mb-4">ACCETTAZIONE</p>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={checkbox}
                onChange={(e) => setCheckbox(e.target.checked)}
                className="mt-1 accent-white"
              />
              <span className="text-zinc-300 text-sm">
                Dichiaro di aver letto e compreso il preventivo e accetto le condizioni indicate. 
                L'accettazione verrà registrata con data, ora e indirizzo IP.
              </span>
            </label>
            <button
              onClick={handleAccetta}
              disabled={!checkbox || loading}
              className="w-full bg-white text-zinc-900 font-medium py-3 rounded-xl disabled:opacity-30 hover:bg-zinc-100 transition-colors"
            >
              {loading ? 'Registrazione...' : 'Accetto il preventivo'}
            </button>
          </div>
        ) : (
          <div className="border border-green-800 bg-green-950/30 rounded-xl p-6 text-center">
            <p className="text-green-400 font-medium">
              {confermato ? '✓ Preventivo accettato con successo' : '✓ Preventivo già accettato'}
            </p>
            <p className="text-zinc-500 text-sm mt-1">L'accettazione è stata registrata</p>
          </div>
        )}
      </main>
    </div>
  );
}
