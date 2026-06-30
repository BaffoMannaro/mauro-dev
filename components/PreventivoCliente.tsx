'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
  meta?: {
    cliente?: { piva?: string; telefono?: string };
    sezioni?: {
      intro?: string;
      descrizione?: string;
      voci?: { modalita?: string; items?: Voce[] };
      tranches?: { descrizione: string; percentuale: number }[];
      tempi?: string;
      garanzia?: string;
      esclusioni?: string[];
      manutenzione?: { descrizione: string; prezzo: number };
      fasi_successive?: string;
      note?: string;
    };
  };
}

function useCountdown(scadenza: string | null) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!scadenza) return;
    const target = new Date(scadenza);
    target.setHours(23, 59, 59, 999);

    const tick = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Scaduto');
        return;
      }
      const giorni = Math.floor(diff / (1000 * 60 * 60 * 24));
      const ore = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minuti = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secondi = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${giorni}g ${ore}h ${minuti}m ${secondi}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [scadenza]);

  return countdown;
}

export default function PreventivoCliente({ preventivo }: { preventivo: Preventivo }) {
  const [accettato, setAccettato] = useState(preventivo.stato === 'accettato');
  const [loading, setLoading] = useState(false);
  const [confermato, setConfermato] = useState(false);
  const [checkbox, setCheckbox] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [vuoleEmail, setVuoleEmail] = useState(false);
  const [erroreAccettazione, setErroreAccettazione] = useState('');
  const countdown = useCountdown(preventivo.scadenza);

  const meta = preventivo.meta;
  const sezioni = meta?.sezioni;

  const imponibile = Number(preventivo.totale);
  const totaleFinale = imponibile;

  const handleAccetta = async () => {
    setErroreAccettazione('');
    if (!nome.trim()) return setErroreAccettazione('Il nome è obbligatorio');
    if (!cognome.trim()) return setErroreAccettazione('Il cognome è obbligatorio');
    if (!email.trim() || !email.includes('@')) return setErroreAccettazione("Inserisci un'email valida");
    if (!checkbox) return setErroreAccettazione('Devi accettare le condizioni');
    setLoading(true);
    const res = await fetch(`/api/p/${preventivo.token}/accetta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cognome, email, vuole_email: vuoleEmail }),
    });
    if (res.ok) {
      setAccettato(true);
      setConfermato(true);
    } else {
      setErroreAccettazione('Errore nella registrazione. Riprova.');
    }
    setLoading(false);
  };

  const inputCls = "w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-white placeholder-dim focus:outline-none focus:border-slate";

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Header */}
      <header className="border-b border-edge px-6 py-4 flex items-center justify-between print:hidden">
        <Image src="/Logo.svg" alt="MAURO DEV" width={120} height={40} className="h-7 w-auto brightness-0 invert" />
        <button
          onClick={() => window.print()}
          className="text-sm text-muted hover:text-white transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z"/>
          </svg>
          Scarica PDF
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* Intestazione */}
        <div className="mb-10">
          <p className="text-dim text-sm mb-1">
            Emesso il {new Date(preventivo.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-3xl font-semibold text-white mb-4">{preventivo.oggetto}</h1>
          {preventivo.scadenza && (
            <div className="flex items-center justify-between">
              <p className="text-muted text-sm">
                Valido fino al{' '}
                <span className="text-white">
                  {new Date(preventivo.scadenza).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </p>
              <p className="text-sm font-mono text-muted print:hidden">
                <span className={countdown === 'Scaduto' ? 'text-red-400' : 'text-accent'}>
                  {countdown}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Intro */}
        {sezioni?.intro && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-muted text-sm whitespace-pre-wrap">{sezioni.intro}</p>
          </div>
        )}

        {/* Destinatario */}
        <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
          <p className="text-dim text-xs font-mono mb-3">DESTINATARIO</p>
          <p className="text-white font-medium">{preventivo.cliente_nome}</p>
          {preventivo.cliente_azienda && preventivo.cliente_azienda !== preventivo.cliente_nome && (
            <p className="text-muted">{preventivo.cliente_azienda}</p>
          )}
          {meta?.cliente?.piva && <p className="text-muted text-sm">P.IVA {meta.cliente.piva}</p>}
          <p className="text-muted text-sm">{preventivo.cliente_email}</p>
          {meta?.cliente?.telefono && <p className="text-muted text-sm">{meta.cliente.telefono}</p>}
        </div>

        {/* Descrizione */}
        {sezioni?.descrizione && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-dim text-xs font-mono mb-3">DESCRIZIONE</p>
            <p className="text-muted text-sm whitespace-pre-wrap">{sezioni.descrizione}</p>
          </div>
        )}

        {/* Riepilogo voci */}
        <div className="bg-surface border border-edge rounded-xl overflow-hidden mb-6">
          <div className="grid grid-cols-12 px-6 py-3 border-b border-edge">
            <span className="col-span-6 text-dim text-xs font-mono">RIEPILOGO</span>
            <span className="col-span-2 text-dim text-xs font-mono text-center">QTÀ</span>
            <span className="col-span-2 text-dim text-xs font-mono text-right">PREZZO</span>
            <span className="col-span-2 text-dim text-xs font-mono text-right">TOTALE</span>
          </div>
          {preventivo.voci.map((voce, i) => (
            <div key={i} className="grid grid-cols-12 px-6 py-4 border-b border-edge/50 last:border-0">
              <span className="col-span-6 text-white">{voce.descrizione}</span>
              <span className="col-span-2 text-muted text-center">{voce.quantita}</span>
              <span className="col-span-2 text-muted text-right">€{Number(voce.prezzo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
              <span className="col-span-2 text-white text-right">€{(voce.quantita * voce.prezzo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
        </div>

        {/* Totale */}
        <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
          <div className="flex justify-between text-white font-semibold text-lg">
            <span>Totale</span>
            <span>€{totaleFinale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-dim text-xs mt-1">{preventivo.iva ? 'IVA inclusa' : 'Esente IVA'}</p>
        </div>

        {/* Tranches */}
        {sezioni?.tranches && sezioni.tranches.length > 0 && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-dim text-xs font-mono mb-3">MODALITÀ DI PAGAMENTO</p>
            {sezioni.tranches.map((t, i) => (
              <div key={i} className="flex justify-between text-sm py-2 border-b border-edge/50 last:border-0">
                <span className="text-muted">{t.descrizione}</span>
                <span className="text-white font-medium">
                  €{Math.round(totaleFinale * t.percentuale / 100).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tempi */}
        {sezioni?.tempi && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-dim text-xs font-mono mb-2">TEMPI DI CONSEGNA</p>
            <p className="text-muted text-sm">{sezioni.tempi}</p>
          </div>
        )}

        {/* Garanzia */}
        {sezioni?.garanzia && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-dim text-xs font-mono mb-2">GARANZIA</p>
            <p className="text-muted text-sm">{sezioni.garanzia}</p>
          </div>
        )}

        {/* Non incluso */}
        {sezioni?.esclusioni && sezioni.esclusioni.length > 0 && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-dim text-xs font-mono mb-3">NON INCLUSO</p>
            {sezioni.esclusioni.map((e, i) => (
              <p key={i} className="text-muted text-sm py-0.5">· {e}</p>
            ))}
          </div>
        )}

        {/* Manutenzione */}
        {sezioni?.manutenzione && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-dim text-xs font-mono mb-2">MANUTENZIONE</p>
            <p className="text-muted text-sm">{sezioni.manutenzione.descrizione}</p>
            <p className="text-accent font-semibold mt-2">€{Number(sezioni.manutenzione.prezzo).toLocaleString('it-IT')}/mese</p>
          </div>
        )}

        {/* Sviluppi futuri */}
        {sezioni?.fasi_successive && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-6">
            <p className="text-dim text-xs font-mono mb-2">SVILUPPI FUTURI</p>
            <p className="text-muted text-sm">{sezioni.fasi_successive}</p>
          </div>
        )}

        {/* Note */}
        {sezioni?.note && (
          <div className="bg-surface border border-edge rounded-xl p-6 mb-8">
            <p className="text-dim text-xs font-mono mb-2">NOTE</p>
            <p className="text-muted text-sm whitespace-pre-wrap">{sezioni.note}</p>
          </div>
        )}

        {/* Accettazione */}
        {!accettato ? (
          <div className="border border-slate rounded-xl p-6 print:hidden">
            <p className="text-dim text-xs font-mono mb-5">ACCETTAZIONE</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-dim text-xs font-mono block mb-1">NOME *</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Mario" className={inputCls} />
              </div>
              <div>
                <label className="text-dim text-xs font-mono block mb-1">COGNOME *</label>
                <input type="text" value={cognome} onChange={(e) => setCognome(e.target.value)}
                  placeholder="Rossi" className={inputCls} />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-dim text-xs font-mono block mb-1">EMAIL *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="mario.rossi@email.it" className={inputCls} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-4 p-3 bg-surface rounded-lg border border-edge">
              <input type="checkbox" checked={vuoleEmail} onChange={(e) => setVuoleEmail(e.target.checked)}
                className="mt-0.5 accent-accent" />
              <span className="text-muted text-sm">
                Voglio ricevere una copia del preventivo accettato via email
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input type="checkbox" checked={checkbox} onChange={(e) => setCheckbox(e.target.checked)}
                className="mt-1 accent-accent" />
              <span className="text-muted text-sm">
                Dichiaro di aver letto e compreso il preventivo e accetto le condizioni indicate.
                L'accettazione verrà registrata con data, ora e indirizzo IP.
              </span>
            </label>
            {erroreAccettazione && (
              <p className="text-red-400 text-xs mb-3 font-mono">⚠ {erroreAccettazione}</p>
            )}
            <button
              onClick={handleAccetta}
              disabled={!checkbox || loading}
              className="w-full bg-accent text-white font-semibold py-3 rounded-xl disabled:opacity-30 hover:bg-accent/90 transition-colors"
            >
              {loading ? 'Registrazione...' : 'Accetto il preventivo'}
            </button>
          </div>
        ) : (
          <div className="border border-green-800 bg-green-950/30 rounded-xl p-6 text-center print:hidden">
            <p className="text-green-400 font-medium">
              {confermato ? '✓ Preventivo accettato con successo' : '✓ Preventivo già accettato'}
            </p>
            <p className="text-dim text-sm mt-1">L'accettazione è stata registrata</p>
          </div>
        )}

        {/* Firma PDF */}
        <div className="hidden print:block mt-12 pt-8 border-t border-zinc-300">
          <div className="flex justify-between text-sm text-zinc-600">
            <div>
              <p className="font-medium text-zinc-800">Mauro Altamura</p>
              <p>maurodev.it</p>
            </div>
            <div className="text-right">
              <p>Firma per accettazione</p>
              <div className="mt-6 border-b border-zinc-400 w-48"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
