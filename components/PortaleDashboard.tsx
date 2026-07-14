'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calcFinanza } from '@/lib/preventivo-finance';

type Preventivo = {
  id: number;
  token: string;
  oggetto: string;
  totale: number | string;
  stato: string;
  scadenza: string | null;
  tranches_stato: { percentuale: number; pagato: boolean }[] | null;
  lavoro_inizio: string | null;
  lavoro_fine: string | null;
  accettato_at: string | null;
  created_at: string;
};

type Fattura = {
  id: number;
  numero: string | null;
  importo: number | string | null;
  data: string | null;
  stato: string;
  pdf_url: string | null;
  note: string | null;
};

type Cliente = {
  id: number;
  nome: string;
  azienda: string | null;
  email: string | null;
  telefono: string | null;
  piva: string | null;
};

const eur = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);

const dataIt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function lavoroStato(p: Preventivo) {
  if (p.lavoro_fine) return { label: 'Completato', cls: 'bg-emerald-500/15 text-emerald-400' };
  if (p.lavoro_inizio) return { label: 'In corso', cls: 'bg-sky-500/15 text-sky-400' };
  return { label: 'In attesa di avvio', cls: 'bg-zinc-500/15 text-zinc-400' };
}

export default function PortaleDashboard({
  cliente,
  preventivi,
  fatture,
}: {
  cliente: Cliente;
  preventivi: Preventivo[];
  fatture: Fattura[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  const daAccettare = useMemo(() => preventivi.filter((p) => p.stato === 'inviato'), [preventivi]);
  const accettati = useMemo(
    () => preventivi.filter((p) => p.stato === 'accettato' || p.stato === 'archiviato'),
    [preventivi]
  );
  const fattureDaPagare = useMemo(() => fatture.filter((f) => f.stato !== 'pagata'), [fatture]);
  const finanza = useMemo(() => calcFinanza(preventivi as any), [preventivi]);

  const rispondiPreventivo = async (id: number, azione: 'accetta' | 'rifiuta') => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/portale/${azione}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preventivo_id: id }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const esci = async () => {
    await fetch('/api/portale/esci', { method: 'POST' });
    window.location.href = '/accedi';
  };

  const nAzioni = daAccettare.length + fattureDaPagare.length;

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header */}
      <header className="border-b border-edge bg-surface">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-3">
          <img src="/Logo.svg" alt="MAURO DEV" className="h-6 w-auto logo-adaptive" />
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-muted truncate hidden sm:block">
              {cliente.azienda || cliente.nome}
            </span>
            <button
              onClick={esci}
              className="text-xs text-dim hover:text-text transition-colors shrink-0"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-1">Ciao {cliente.nome} 👋</h1>
        <p className="text-muted text-sm mb-6">Questa è la tua area riservata.</p>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Azioni richieste — hero */}
          <section className="md:col-span-3 bg-surface border border-edge rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold">Azioni richieste</h2>
              {nAzioni > 0 && (
                <span className="text-xs bg-accent text-on-accent rounded-full px-2 py-0.5">{nAzioni}</span>
              )}
            </div>
            {nAzioni === 0 ? (
              <p className="text-muted text-sm">Tutto in ordine, non serve niente da parte tua. ✓</p>
            ) : (
              <div className="flex flex-col gap-2">
                {daAccettare.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 justify-between bg-surface2 rounded-xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.oggetto}</p>
                      <p className="text-xs text-dim">Preventivo da valutare · {eur(Number(p.totale))}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/p/${p.token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg border border-edge hover:bg-surface transition-colors"
                      >
                        Vedi
                      </a>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => rispondiPreventivo(p.id, 'rifiuta')}
                        className="text-xs px-3 py-1.5 rounded-lg border border-edge text-dim hover:text-text transition-colors disabled:opacity-50"
                      >
                        Rifiuta
                      </button>
                      <button
                        disabled={busyId === p.id}
                        onClick={() => rispondiPreventivo(p.id, 'accetta')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-accent text-on-accent hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        Accetta
                      </button>
                    </div>
                  </div>
                ))}
                {fattureDaPagare.map((f) => (
                  <div
                    key={f.id}
                    className="flex flex-wrap items-center gap-3 justify-between bg-surface2 rounded-xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        Fattura {f.numero ? `n. ${f.numero}` : ''} da saldare
                      </p>
                      <p className="text-xs text-dim">
                        {f.importo != null ? eur(Number(f.importo)) : ''} · {dataIt(f.data)}
                      </p>
                    </div>
                    {f.pdf_url && (
                      <a
                        href={f.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg border border-edge hover:bg-surface transition-colors shrink-0"
                      >
                        Apri PDF
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Riepilogo economico */}
          <section className="bg-surface border border-edge rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Riepilogo</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Totale lavori</dt>
                <dd className="font-medium">{eur(finanza.totale)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Già versato</dt>
                <dd className="font-medium text-emerald-400">{eur(finanza.ricevuto)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Ancora da versare</dt>
                <dd className="font-medium">{eur(finanza.daDare)}</dd>
              </div>
            </dl>
          </section>

          {/* Avanzamento lavori */}
          <section className="md:col-span-2 bg-surface border border-edge rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Avanzamento lavori</h2>
            {accettati.length === 0 ? (
              <p className="text-muted text-sm">Nessun lavoro attivo al momento.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {accettati.map((p) => {
                  const st = lavoroStato(p);
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-3 bg-surface2 rounded-xl px-4 py-3">
                      <p className="text-sm font-medium truncate">{p.oggetto}</p>
                      <span className={`text-xs rounded-full px-2.5 py-1 shrink-0 ${st.cls}`}>{st.label}</span>
                    </div>
                  );
                })}
                <p className="text-xs text-dim mt-1">
                  Presto qui vedrai il dettaglio delle singole fasi e cosa serve da parte tua.
                </p>
              </div>
            )}
          </section>

          {/* Preventivi */}
          <section className="bg-surface border border-edge rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Preventivi</h2>
            {preventivi.length === 0 ? (
              <p className="text-muted text-sm">Nessun preventivo.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {preventivi.map((p) => (
                  <li key={p.id}>
                    <a
                      href={`/p/${p.token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 text-sm hover:text-accent transition-colors"
                    >
                      <span className="truncate">{p.oggetto}</span>
                      <span className="text-xs text-dim shrink-0">{eur(Number(p.totale))}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Fatture */}
          <section className="md:col-span-2 bg-surface border border-edge rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Fatture</h2>
            {fatture.length === 0 ? (
              <p className="text-muted text-sm">Nessuna fattura disponibile.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {fatture.map((f) => (
                  <li
                    key={f.id}
                    className="flex flex-wrap items-center justify-between gap-2 bg-surface2 rounded-xl px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {f.numero ? `Fattura n. ${f.numero}` : 'Fattura'}
                        <span className="text-dim font-normal"> · {dataIt(f.data)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm">{f.importo != null ? eur(Number(f.importo)) : ''}</span>
                      <span
                        className={`text-xs rounded-full px-2.5 py-1 ${
                          f.stato === 'pagata'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {f.stato === 'pagata' ? 'Pagata' : 'Da pagare'}
                      </span>
                      {f.pdf_url && (
                        <a
                          href={f.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg border border-edge hover:bg-surface transition-colors"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Messaggi (placeholder Fase 3) */}
          <section className="bg-surface border border-edge rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Messaggi</h2>
            <p className="text-muted text-sm">
              Presto potrai scrivermi da qui e ritrovare tutta la nostra conversazione in un unico posto.
            </p>
          </section>

          {/* I tuoi dati */}
          <section className="md:col-span-3 bg-surface border border-edge rounded-2xl p-5">
            <h2 className="font-semibold mb-3">I tuoi dati</h2>
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-dim text-xs">Nome</dt>
                <dd className="mt-0.5">{cliente.nome}</dd>
              </div>
              {cliente.azienda && (
                <div>
                  <dt className="text-dim text-xs">Azienda</dt>
                  <dd className="mt-0.5">{cliente.azienda}</dd>
                </div>
              )}
              {cliente.email && (
                <div className="min-w-0">
                  <dt className="text-dim text-xs">Email</dt>
                  <dd className="mt-0.5 truncate">{cliente.email}</dd>
                </div>
              )}
              {cliente.telefono && (
                <div>
                  <dt className="text-dim text-xs">Telefono</dt>
                  <dd className="mt-0.5">{cliente.telefono}</dd>
                </div>
              )}
              {cliente.piva && (
                <div>
                  <dt className="text-dim text-xs">P. IVA</dt>
                  <dd className="mt-0.5">{cliente.piva}</dd>
                </div>
              )}
            </dl>
            <p className="text-xs text-dim mt-3">
              Un dato non è corretto? Scrivimi e lo sistemo.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
