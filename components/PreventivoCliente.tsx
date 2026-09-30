'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useTracciaVisita } from './useTracciaVisita';

// Notifica il tracciamento quando il cliente apre una sezione.
const SezioneAperta = createContext<(titolo: string) => void>(() => {});

const IBAN = 'IT31T0103041570000001893771';

/** €2.400,00 — raggruppa anche le migliaia a 4 cifre (toLocaleString it-IT non lo fa). */
const eur = (n: number) => `€${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const perc = (n: number) => `${Number(n).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`;

const IconaDownload = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      title={copied ? 'Copiato' : 'Copia IBAN'}
      aria-label="Copia IBAN"
      className="print:hidden shrink-0 text-dim hover:text-accent transition-colors cursor-pointer"
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

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
    preventivo?: { modalita_pagamento?: string; schema_pagamento?: string };
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
    const target = new Date(`${scadenza.slice(0, 10)}T23:59:59.999`);
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setCountdown('Scaduto'); return; }
      const g = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${g}g ${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [scadenza]);
  return countdown;
}

/** true quando l'elemento con questo id è visibile (es. il modulo di accettazione in fondo). */
function useVisibile(id: string) {
  const [visibile, setVisibile] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisibile(e.isIntersecting), { rootMargin: '0px 0px -15% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return visibile;
}

function AccordionSection({
  title,
  children,
  flush = false,
  defaultOpen = false,
  animazione = 'anima-rivela',
}: {
  title: string;
  children: React.ReactNode;
  flush?: boolean;
  defaultOpen?: boolean;
  /** anima-entrata per le sezioni visibili all'apertura, anima-rivela (allo scroll) per le altre. */
  animazione?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [seen, setSeen] = useState(defaultOpen);
  const traccia = useContext(SezioneAperta);

  const toggle = () => {
    if (!open) traccia(title.split(':')[0]);
    setOpen((v) => {
      if (!v) setSeen(true);
      return !v;
    });
  };

  return (
    <div className={`${animazione} bg-surface border border-edge rounded-xl overflow-hidden print:break-inside-avoid`}>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-surface2/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[3px] h-5 bg-accent rounded-sm shrink-0" />
          <p className="text-muted font-bold text-xs tracking-widest uppercase leading-snug">{title}</p>
        </div>
        <div className="relative flex items-center shrink-0">
          {!seen && (
            <>
              <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-accent motion-safe:animate-ping opacity-60" />
              <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-accent" />
            </>
          )}
          <svg
            className={`w-4 h-4 text-dim transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>
      {/* Apertura animata: righe della griglia da 0fr a 1fr (altezza automatica senza misure in JS). */}
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'} print:grid-rows-[1fr]`}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div className={`border-t border-edge/40 transition-[opacity,translate] duration-300 ease-out ${open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'} print:opacity-100 print:translate-y-0 ${flush ? '' : 'px-5 pt-4 pb-5'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreventivoCliente({
  preventivo,
  scadutoAlServer = false,
  richiestaInviata = false,
  temaChiaro = false,
}: {
  preventivo: Preventivo;
  /** Stato calcolato dal server, per non mostrare il modulo sbagliato prima del countdown. */
  scadutoAlServer?: boolean;
  /** Il cliente ha già chiesto un'accettazione tardiva, in attesa di risposta. */
  richiestaInviata?: boolean;
  /** Tema chiaro forzato dal server (PDF e ?theme=light). */
  temaChiaro?: boolean;
  pdf?: boolean;
}) {
  const [accettato, setAccettato] = useState(preventivo.stato === 'accettato');
  const [loading, setLoading] = useState(false);
  const [confermato, setConfermato] = useState(false);
  const [checkbox, setCheckbox] = useState(false);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [erroreAccettazione, setErroreAccettazione] = useState('');
  const countdown = useCountdown(accettato ? null : preventivo.scadenza);
  const scaduto = countdown === 'Scaduto' || (countdown === '' && scadutoAlServer);
  const [tardiva, setTardiva] = useState<'no' | 'invio' | 'inviata'>(richiestaInviata ? 'inviata' : 'no');
  const [messaggio, setMessaggio] = useState('');
  const traccia = useTracciaVisita(preventivo.token);
  // Arrivati al modulo di accettazione il pulsante flottante non serve più.
  const moduloVisibile = useVisibile('accettazione');
  const mostraAccetta = !accettato && !(scaduto && tardiva === 'inviata');

  const meta = preventivo.meta;
  const sezioni = meta?.sezioni;
  const totale = Number(preventivo.totale);
  const dataEmissione = new Date(preventivo.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleAccetta = async () => {
    setErroreAccettazione('');
    if (!nome.trim()) return setErroreAccettazione('Il nome è obbligatorio');
    if (!cognome.trim()) return setErroreAccettazione('Il cognome è obbligatorio');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErroreAccettazione("Inserisci un'email valida");
    if (!checkbox) return setErroreAccettazione('Devi accettare le condizioni');
    setLoading(true);
    const res = await fetch(`/api/p/${preventivo.token}/accetta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cognome, email }),
    });
    if (res.ok) { setAccettato(true); setConfermato(true); }
    else setErroreAccettazione((await res.json().catch(() => null))?.error ?? 'Errore nella registrazione. Riprova.');
    setLoading(false);
  };

  const handleTardiva = async () => {
    setErroreAccettazione('');
    if (!nome.trim()) return setErroreAccettazione('Il nome è obbligatorio');
    if (!cognome.trim()) return setErroreAccettazione('Il cognome è obbligatorio');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErroreAccettazione("Inserisci un'email valida");
    setTardiva('invio');
    const res = await fetch(`/api/p/${preventivo.token}/richiesta-tardiva`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, cognome, email, messaggio }),
    });
    if (res.ok) setTardiva('inviata');
    else {
      setTardiva('no');
      setErroreAccettazione((await res.json().catch(() => null))?.error ?? 'Errore nell’invio. Riprova.');
    }
  };

  const inputCls = "w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text placeholder-dim focus:outline-none focus:border-slate";

  return (
    <SezioneAperta.Provider value={traccia.sezione}>
    <div className={`min-h-screen bg-bg text-text ${temaChiaro ? 'tema-chiaro' : ''}`}>

      {/* ── Desktop: PDF fisso in alto a destra, Accetta in basso a destra ── */}
      <a
        href={`/api/p/${preventivo.token}/pdf`}
        download
        onClick={traccia.pdf}
        className="anima-entrata [--ritardo:400ms] print:hidden hidden lg:flex fixed top-4 right-4 z-50 items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/90 text-on-accent text-sm font-semibold rounded-xl shadow-lg transition-[background-color,translate,scale] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer"
      >
        <IconaDownload />
        Scarica PDF
      </a>
      {mostraAccetta && (
        <a
          href="#accettazione"
          aria-hidden={moduloVisibile}
          tabIndex={moduloVisibile ? -1 : undefined}
          className={`print:hidden hidden lg:flex fixed bottom-4 right-4 z-50 items-center gap-2 px-5 py-3 bg-text text-bg text-sm font-semibold rounded-xl shadow-lg transition-[opacity,translate,scale] duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98] ${
            moduloVisibile ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
          }`}
        >
          {scaduto ? 'Chiedi di accettarlo' : 'Accetta il preventivo'}
        </a>
      )}

      {/* ── Mobile/tablet: barra in basso con PDF e Accetta, non copre l'intestazione ── */}
      <div className="anima-barra print:hidden lg:hidden fixed bottom-0 inset-x-0 z-50 flex gap-2 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-bg/90 backdrop-blur border-t border-edge">
        <a
          href={`/api/p/${preventivo.token}/pdf`}
          download
          onClick={traccia.pdf}
          className={`flex items-center justify-center gap-2 px-4 py-3 bg-accent text-on-accent text-sm font-semibold rounded-xl transition-[flex-grow,scale] duration-300 ease-out active:scale-[0.98] ${mostraAccetta && !moduloVisibile ? 'grow-0' : 'grow'}`}
        >
          <IconaDownload />
          PDF
        </a>
        {mostraAccetta && !moduloVisibile && (
          <a href="#accettazione" className="anima-comparsa flex-1 flex items-center justify-center px-4 py-3 bg-text text-bg text-sm font-semibold rounded-xl active:scale-[0.98] transition-[scale]">
            {scaduto ? 'Chiedi di accettarlo' : 'Accetta il preventivo'}
          </a>
        )}
      </div>

      {/* ── Header — dark slate + pink line (matches PDF header) ── */}
      <header className="bg-slate relative print:bg-slate">
        <div className="anima-linea absolute bottom-0 left-0 right-0 h-[3px] bg-accent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <img src="/Logo.svg" alt="MAURO DEV" width={96} height={28} className="anima-entrata h-7 w-auto shrink-0" style={{ filter: 'brightness(0) invert(1)' }} />
          <div className="anima-entrata [--ritardo:120ms] text-right min-w-0">
            <p className="text-white font-bold text-sm tracking-[0.15em]">PREVENTIVO</p>
            <p className="text-white text-xs mt-0.5">{dataEmissione}</p>
          </div>
        </div>
      </header>

      <main className="pdf-pagine max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-28 lg:pb-8 flex flex-col gap-6">

        {/* ── Destinatario (matches PDF dest_t table) ── */}
        <div className="anima-entrata [--ritardo:200ms] bg-surface border border-edge rounded-xl overflow-hidden print:break-inside-avoid">
          <div className="bg-surface2 px-5 py-3 flex justify-between border-b border-edge">
            <p className="text-accent text-xs font-bold tracking-widest">DESTINATARIO</p>
            <p className="hidden sm:block print:block text-accent text-xs font-bold tracking-widest">
              {accettato ? 'STATO' : 'VALIDITÀ'}
            </p>
          </div>
          <div className="px-5 py-4 flex flex-col sm:flex-row print:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-text font-bold text-base leading-snug">{preventivo.cliente_nome}</p>
              {preventivo.cliente_azienda && preventivo.cliente_azienda !== preventivo.cliente_nome && (
                <p className="text-muted text-sm">{preventivo.cliente_azienda}</p>
              )}
              {meta?.cliente?.piva && <p className="text-muted text-sm">P.IVA {meta.cliente.piva}</p>}
              <p className="text-muted text-sm break-all">{preventivo.cliente_email}</p>
              {meta?.cliente?.telefono && <p className="text-muted text-sm">{meta.cliente.telefono}</p>}
            </div>
            <div className="sm:text-right print:text-right sm:shrink-0 border-t border-edge/40 pt-3 sm:border-0 sm:pt-0 print:border-0 print:pt-0">
              <p className="sm:hidden print:hidden text-accent text-xs font-bold tracking-widest mb-1">
                {accettato ? 'STATO' : 'VALIDITÀ'}
              </p>
              {accettato ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Accettato
                </span>
              ) : (
                <>
                  {preventivo.scadenza && (
                    <p className="text-muted text-sm">
                      {scaduto ? 'Scaduto il ' : 'Fino al '}
                      {new Date(`${preventivo.scadenza}T12:00:00`).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  {countdown && (
                    <p className={`text-xs font-mono mt-1 print:hidden ${countdown === 'Scaduto' ? 'text-red-400' : 'text-accent'}`}>
                      {countdown}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Oggetto ── */}
        <AccordionSection title={`Oggetto: ${preventivo.oggetto}`} defaultOpen animazione="anima-entrata [--ritardo:300ms]">
          {sezioni?.intro && (
            <p className="text-muted text-sm leading-relaxed">{sezioni.intro}</p>
          )}
          {sezioni?.descrizione && (
            <p className="text-muted text-sm leading-relaxed mt-3 whitespace-pre-wrap">{sezioni.descrizione}</p>
          )}
          {!sezioni?.intro && !sezioni?.descrizione && (
            <p className="text-dim text-sm italic">Nessuna descrizione aggiuntiva.</p>
          )}
        </AccordionSection>

        {/* ── Dettaglio voci ── */}
        <AccordionSection title="Dettaglio attività" flush defaultOpen>
          {preventivo.voci.map((voce, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-4 px-5 py-4 border-t border-edge/40 transition-colors hover:bg-surface2/40 ${i === 0 ? 'border-t-0' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-text font-semibold text-sm">{voce.descrizione}</p>
                {voce.quantita > 1 && (
                  <p className="text-dim text-xs mt-0.5">Qtà: {voce.quantita}</p>
                )}
              </div>
              <p className="text-accent font-bold text-base shrink-0 tabular-nums whitespace-nowrap">
                {eur(voce.quantita * voce.prezzo)}
              </p>
            </div>
          ))}
        </AccordionSection>

        {/* ── Compenso (FISSO — non collassabile) ── */}
        <div className="anima-rivela bg-surface border border-edge rounded-xl overflow-hidden print:break-inside-avoid">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 bg-surface2/50 border-b border-edge">
            <p className="text-muted text-sm font-semibold">Compenso totale</p>
            <p className="text-accent font-bold text-2xl tabular-nums whitespace-nowrap">{eur(totale)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
            <p className="text-muted text-sm">Modalità di pagamento</p>
            <p className="text-text text-sm text-right">
              {meta?.preventivo?.modalita_pagamento ?? 'Bonifico bancario'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 border-t border-edge/40">
            <p className="text-muted text-sm shrink-0">IBAN</p>
            <div className="flex items-center gap-2 min-w-0 ml-auto">
              <span className="text-text text-sm font-mono tracking-tight break-all">{IBAN}</span>
              <CopyButton value={IBAN} />
            </div>
          </div>
          {meta?.preventivo?.schema_pagamento && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 border-t border-edge/40">
              <p className="text-muted text-sm">Schema pagamento</p>
              <p className="text-text text-sm text-right">{meta.preventivo.schema_pagamento}</p>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3 border-t border-edge/40">
            <p className="text-muted text-sm">IVA</p>
            <p className="text-text text-sm">Esente</p>
          </div>
        </div>

        {/* ── Tranches ── */}
        {sezioni?.tranches && sezioni.tranches.length > 0 && (
          <AccordionSection title="Piano di pagamento" flush defaultOpen>
            {sezioni.tranches.map((t, i) => (
              <div
                key={i}
                className={`flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 px-5 py-4 border-t border-edge/40 ${i === 0 ? 'border-t-0' : ''}`}
              >
                <span className="order-1 shrink-0 bg-slate text-white text-xs font-bold px-2.5 py-1 rounded-md">{i + 1}ª tranche</span>
                <p className="order-3 basis-full sm:order-2 sm:basis-auto sm:flex-1 min-w-0 text-muted text-sm">{t.descrizione}</p>
                <p className="order-2 ml-auto sm:order-3 sm:ml-0 shrink-0 text-accent font-bold text-sm tabular-nums whitespace-nowrap">
                  {eur(Math.round((totale * t.percentuale) / 100))}
                  <span className="text-dim font-normal text-xs ml-1">({perc(t.percentuale)})</span>
                </p>
              </div>
            ))}
          </AccordionSection>
        )}

        {/* ── Tempi ── */}
        {sezioni?.tempi && (
          <AccordionSection title="Tempi di consegna">
            <p className="text-muted text-sm leading-relaxed">{sezioni.tempi}</p>
          </AccordionSection>
        )}

        {/* ── Garanzia ── */}
        {sezioni?.garanzia && (
          <AccordionSection title="Garanzia post-lancio">
            <p className="text-muted text-sm leading-relaxed">{sezioni.garanzia}</p>
          </AccordionSection>
        )}

        {/* ── Non incluso ── */}
        {sezioni?.esclusioni && sezioni.esclusioni.length > 0 && (
          <AccordionSection title="Cosa non include questo preventivo">
            <div className="flex flex-col gap-2">
              {sezioni.esclusioni.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-accent font-bold text-sm leading-5 shrink-0">—</span>
                  <p className="text-muted text-sm leading-5">{e}</p>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* ── Manutenzione ── */}
        {sezioni?.manutenzione && (
          <AccordionSection title="Piano di manutenzione">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <p className="text-muted text-sm leading-relaxed flex-1">{sezioni.manutenzione.descrizione}</p>
              <p className="text-accent font-bold text-xl shrink-0 tabular-nums whitespace-nowrap">
                {eur(Number(sezioni.manutenzione.prezzo))}<span className="text-dim font-normal text-sm">/mese</span>
              </p>
            </div>
          </AccordionSection>
        )}

        {/* ── Fasi successive ── */}
        {sezioni?.fasi_successive && (
          <AccordionSection title="Fasi successive">
            <p className="text-muted text-sm leading-relaxed">{sezioni.fasi_successive}</p>
          </AccordionSection>
        )}

        {/* ── Note ── */}
        {sezioni?.note && (
          <AccordionSection title="Note">
            <p className="text-muted text-sm whitespace-pre-wrap leading-relaxed">{sezioni.note}</p>
          </AccordionSection>
        )}

        {/* ── Accettazione / Conferma ── */}
        {!accettato && scaduto ? (
          <div id="accettazione" className="scroll-mt-6 print:hidden">
            {tardiva === 'inviata' ? (
              <div className="border border-edge bg-surface rounded-xl p-6 text-center">
                <p className="text-text font-semibold">Richiesta inviata</p>
                <p className="text-dim text-sm mt-1">
                  Ho ricevuto la tua richiesta di accettare questo preventivo anche se è scaduto: ti rispondo a breve via email.
                </p>
              </div>
            ) : (
              <AccordionSection title="Preventivo scaduto" defaultOpen>
                <p className="text-muted text-sm mb-5 leading-relaxed">
                  Il periodo di validità è terminato, ma puoi ancora chiedermi di accettarlo alle stesse condizioni.
                  Compila il modulo: mi arriva una email e ti rispondo al più presto.
                </p>
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-3">
                  <div>
                    <input type="text" name="given-name" autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome *" aria-label="Nome" required className={inputCls} />
                  </div>
                  <div>
                    <input type="text" name="family-name" autoComplete="family-name" value={cognome} onChange={(e) => setCognome(e.target.value)} placeholder="Cognome *" aria-label="Cognome" required className={inputCls} />
                  </div>
                </div>
                <div className="mb-3">
                  <input type="email" name="email" autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" aria-label="Email" required className={inputCls} />
                </div>
                <div className="mb-4">
                  <textarea value={messaggio} onChange={(e) => setMessaggio(e.target.value)} rows={3} maxLength={2000}
                    placeholder="Messaggio (facoltativo)" aria-label="Messaggio" className={`${inputCls} resize-y`} />
                </div>
                {erroreAccettazione && <p className="text-red-400 text-xs mb-3 font-mono">⚠ {erroreAccettazione}</p>}
                <button
                  onClick={handleTardiva}
                  disabled={tardiva === 'invio'}
                  className="w-full bg-accent text-on-accent font-semibold py-3 rounded-xl disabled:opacity-30 hover:bg-accent/90 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.99] transition-[background-color,opacity,translate,scale] duration-200 cursor-pointer"
                >
                  {tardiva === 'invio' ? 'Invio…' : 'Chiedi di accettarlo lo stesso'}
                </button>
              </AccordionSection>
            )}
          </div>
        ) : !accettato ? (
          <div id="accettazione" className="scroll-mt-6 print:hidden">
          <AccordionSection title="Accettazione" defaultOpen>
            <p className="text-muted text-sm mb-5 leading-relaxed">
              Compila il modulo per accettare il preventivo. L’accettazione viene registrata con data, ora e indirizzo IP e riceverai subito una email di conferma con il riepilogo.
            </p>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 mb-3">
              <div>
                <input type="text" name="given-name" autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome *" aria-label="Nome" required className={inputCls} />
              </div>
              <div>
                <input type="text" name="family-name" autoComplete="family-name" value={cognome} onChange={(e) => setCognome(e.target.value)}
                  placeholder="Cognome *" aria-label="Cognome" required className={inputCls} />
              </div>
            </div>
            <div className="mb-4">
              <input type="email" name="email" autoComplete="email" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email *" aria-label="Email" required className={inputCls} />
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-5">
              <input type="checkbox" checked={checkbox} onChange={(e) => setCheckbox(e.target.checked)}
                className="mt-1 accent-accent shrink-0" />
              <span className="text-muted text-sm">
                Dichiaro di aver letto e compreso il preventivo e accetto le condizioni indicate.
              </span>
            </label>
            {erroreAccettazione && (
              <p className="text-red-400 text-xs mb-3 font-mono">⚠ {erroreAccettazione}</p>
            )}
            <button
              onClick={handleAccetta}
              disabled={!checkbox || loading}
              className="w-full bg-accent text-on-accent font-semibold py-3 rounded-xl disabled:opacity-30 hover:bg-accent/90 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.99] transition-[background-color,opacity,translate,scale] duration-200 cursor-pointer"
            >
              {loading ? 'Registrazione…' : 'Accetto il preventivo'}
            </button>
          </AccordionSection>
          </div>
        ) : (
          <div className="anima-successo border border-green-800 bg-green-950/30 rounded-xl p-6 text-center print:hidden">
            <p className="text-green-400 font-semibold">
              {confermato ? '✓ Preventivo accettato con successo' : '✓ Preventivo già accettato'}
            </p>
            <p className="text-dim text-sm mt-1">
              {confermato ? 'Ti ho inviato una email di conferma con il riepilogo.' : "L'accettazione è stata registrata"}
            </p>
          </div>
        )}

        {/* ── Footer firma (solo stampa) ── */}
        <div className="hidden print:block mt-8 pt-6 border-t border-edge">
          <div className="flex justify-between text-sm text-muted">
            <div>
              <p className="font-bold text-text">Mauro Altamura</p>
              <p>altamura.mauro@gmail.com · maurodev.it</p>
              <p className="mt-1">P.IVA IT08250840728</p>
            </div>
            <div className="text-right">
              <p className="text-dim text-xs mb-6">Per accettazione — {preventivo.cliente_nome}</p>
              <div className="border-b border-muted w-52 mb-1" />
              <p className="text-dim text-xs">Firma e data</p>
            </div>
          </div>
        </div>

      </main>
    </div>
    </SezioneAperta.Provider>
  );
}
