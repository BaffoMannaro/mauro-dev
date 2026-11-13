'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calcFinanza } from '@/lib/preventivo-finance';
import { euroCent } from '@/lib/formato';
import { Icona, Omino } from '@/components/pixel/Sprite';
import { Etichetta, Lampo, PaginaCliente, Tile, Titolo, type Area } from '@/components/pixel/Bento';

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
  scaduto?: boolean;
};

type Fattura = {
  id: number;
  numero: string | null;
  importo: number | string | null;
  data: string | null;
  stato: string;
  /** Totale meno pagamenti già ricevuti. */
  residuo?: number | null;
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

const eur = euroCent;

const dataIt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function lavoroStato(p: Preventivo): { label: string; area: Area } {
  if (p.lavoro_fine) return { label: 'Completato', area: 'fatto' };
  if (p.lavoro_inizio) return { label: 'In corso', area: 'lavori' };
  return { label: 'Da avviare', area: 'fumo' };
}

const STATO_PREVENTIVO: Record<string, { label: string; area: Area }> = {
  inviato: { label: 'Da valutare', area: 'azione' },
  accettato: { label: 'Accettato', area: 'fatto' },
  archiviato: { label: 'Concluso', area: 'fumo' },
  rifiutato: { label: 'Non accettato', area: 'fumo' },
};

const btnSecondario = 'px-btn font-pixel text-[11px] px-3 py-2 bg-ink-4 text-nebbia hover:text-chiaro';

export default function PortaleDashboard({
  cliente,
  preventivi,
  fatture,
  haCanone = false,
}: {
  haCanone?: boolean;
  cliente: Cliente;
  preventivi: Preventivo[];
  fatture: Fattura[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  const daAccettare = useMemo(() => preventivi.filter((p) => p.stato === 'inviato'), [preventivi]);
  const accettati = useMemo(() => preventivi.filter((p) => p.stato === 'accettato' || p.stato === 'archiviato'), [preventivi]);
  const inCorso = accettati.filter((p) => p.lavoro_inizio && !p.lavoro_fine);
  const fattureDaPagare = useMemo(() => fatture.filter((f) => f.stato !== 'pagata'), [fatture]);
  const finanza = useMemo(() => calcFinanza(preventivi as never), [preventivi]);

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

  const nAzioni = daAccettare.length + fattureDaPagare.length;
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' });

  return (
    <PaginaCliente cliente={cliente} attiva="portale" haCanone={haCanone}>
      <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-3 sm:gap-4">
        {/* Benvenuto */}
        <section className="md:col-span-4 xl:col-span-6 px-notch bg-ink-2 p-4 sm:p-6 flex flex-col justify-between gap-5 min-w-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              {nAzioni > 0 && (
                <span className="absolute -top-4 -right-2 px-hop text-azione">
                  <Icona nome="esclamativo" scala={3} />
                </span>
              )}
              <div className="sm:hidden"><Omino scala={5} alLavoro={inCorso.length > 0} /></div>
              <div className="hidden sm:block"><Omino scala={8} alLavoro={inCorso.length > 0} /></div>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-fumo capitalize mb-1.5" suppressHydrationWarning>{oggi}</p>
              <h1 className="font-pixel text-2xl sm:text-4xl leading-tight mb-3 break-words">Ciao {cliente.nome.split(' ')[0]}</h1>
              <p className="inline-block bg-ink-3 px-notch-sm px-3 py-2 text-sm text-nebbia leading-snug">
                {nAzioni > 0 ? (
                  <>
                    C&apos;è qualcosa per te nel riquadro <span className="text-azione font-medium">rosa</span>.
                  </>
                ) : inCorso.length > 0 ? (
                  <>
                    Sto lavorando a <span className="text-lavori font-medium">{inCorso[0].oggetto}</span>
                    {inCorso.length > 1 ? ` e ad altri ${inCorso.length - 1}` : ''}
                    <span className="px-dots" />
                  </>
                ) : (
                  <>Questa è la tua area: preventivi, lavori e fatture, tutto qui.</>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
              <Lampo area="soldi" className="col-span-2 sm:col-span-1" valore={eur(finanza.daDare)} label="ancora da versare" />
              <Lampo area="lavori" valore={String(inCorso.length)} label={inCorso.length === 1 ? 'lavoro in corso' : 'lavori in corso'} />
              <Lampo area="azione" valore={String(daAccettare.length)} label="preventivi da valutare" />
            </div>
            {haCanone && (
              <a href="/canone" className="px-btn font-pixel text-xs px-4 py-3 bg-ore text-ink grid place-items-center text-center">
                Ore e lavori
              </a>
            )}
          </div>
        </section>

        {/* Azioni richieste */}
        {nAzioni > 0 ? (
          <Tile area="azione" className="md:col-span-2 xl:col-span-3">
            <Titolo area="azione" icona="esclamativo" destra={<span className="font-pixel text-azione text-lg leading-none">{nAzioni}</span>}>
              Per te
            </Titolo>
            <div className="flex flex-col gap-2">
              {daAccettare.map((p) => (
                <div key={p.id} className="bg-ink-3 px-notch-sm p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-pixel text-lg text-azione leading-none tabular-nums">{eur(Number(p.totale))}</p>
                    <span className="text-xs text-fumo">{p.scaduto ? 'scaduto' : 'preventivo'}</span>
                  </div>
                  <p className="text-sm text-chiaro mt-2">{p.oggetto}</p>
                  {p.scaduto && <p className="text-xs text-nebbia mt-1">Aprilo per chiedere un&apos;accettazione tardiva.</p>}
                  <div className="flex items-center gap-2 mt-3">
                    {!p.scaduto && (
                      <button disabled={busyId === p.id} onClick={() => rispondiPreventivo(p.id, 'accetta')}
                        className="px-btn flex-1 font-pixel text-[11px] px-3 py-2 bg-azione text-ink">
                        Accetta
                      </button>
                    )}
                    <a href={`/p/${p.token}`} target="_blank" rel="noreferrer" className={btnSecondario}>
                      {p.scaduto ? 'Apri' : 'Leggi'}
                    </a>
                    {!p.scaduto && (
                      <button disabled={busyId === p.id} onClick={() => rispondiPreventivo(p.id, 'rifiuta')} className={btnSecondario}>
                        No
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {fattureDaPagare.map((f) => (
                <div key={f.id} className="bg-ink-3 px-notch-sm p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-pixel text-lg text-soldi leading-none tabular-nums">
                      {eur(Number(f.stato === 'parziale' && f.residuo != null ? f.residuo : f.importo ?? 0))}
                    </p>
                    {f.pdf_url && (
                      <a href={f.pdf_url} target="_blank" rel="noreferrer" className="font-pixel text-[11px] text-soldi hover:underline underline-offset-4">PDF</a>
                    )}
                  </div>
                  <p className="text-sm text-chiaro mt-2">Fattura {f.numero ? `n. ${f.numero}` : ''} da saldare</p>
                  <p className="text-xs text-fumo mt-0.5">
                    {f.stato === 'parziale' && f.residuo != null ? `su ${eur(Number(f.importo))} totali · ` : ''}del {dataIt(f.data)}
                  </p>
                </div>
              ))}
            </div>
          </Tile>
        ) : (
          <Tile area="fatto" className="md:col-span-2 xl:col-span-3 flex flex-col justify-center">
            <Titolo area="fatto" icona="spunta">Tutto a posto</Titolo>
            <p className="text-sm text-nebbia">Non serve niente da parte tua. Se arriva un preventivo o una fattura, compare qui.</p>
          </Tile>
        )}

        {/* Riepilogo economico */}
        <Tile area="soldi" className="md:col-span-2 xl:col-span-3">
          <Titolo area="soldi" icona="moneta">Riepilogo</Titolo>
          <Riepilogo totale={finanza.totale} ricevuto={finanza.ricevuto} daDare={finanza.daDare} />
        </Tile>

        {/* Avanzamento lavori */}
        <Tile area="lavori" className="md:col-span-4 xl:col-span-7">
          <Titolo area="lavori" icona="bandiera">Lavori</Titolo>
          {accettati.length === 0 ? (
            <div className="flex items-center gap-4 bg-ink-3 px-notch-sm p-4">
              <Omino scala={3} />
              <p className="text-sm text-nebbia">Nessun lavoro attivo al momento. Quando accetti un preventivo, qui ne segui l&apos;avanzamento.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {accettati.map((p) => {
                const st = lavoroStato(p);
                const passi = [true, !!p.lavoro_inizio, !!p.lavoro_fine];
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 bg-ink-3/60 px-notch-sm p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-chiaro">{p.oggetto}</p>
                      <p className="text-xs text-fumo mt-0.5">
                        {p.lavoro_fine
                          ? `consegnato il ${dataIt(p.lavoro_fine)}`
                          : p.lavoro_inizio
                            ? `iniziato il ${dataIt(p.lavoro_inizio)}`
                            : p.accettato_at
                              ? `accettato il ${dataIt(p.accettato_at)}`
                              : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Tre passi in pixel: accettato, in corso, consegnato */}
                      <span className="flex gap-[3px]" aria-hidden>
                        {passi.map((ok, i) => (
                          <span key={i} className={`block w-4 h-2.5 ${ok ? (p.lavoro_fine ? 'bg-fatto' : 'bg-lavori') : 'bg-ink-4'}`} />
                        ))}
                      </span>
                      <Etichetta area={st.area}>{st.label}</Etichetta>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        {/* Preventivi */}
        <Tile area="lavori" className="md:col-span-2 xl:col-span-5">
          <Titolo area="lavori" icona="registro">Preventivi</Titolo>
          {preventivi.length === 0 ? (
            <p className="text-sm text-nebbia">Nessun preventivo.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {preventivi.map((p) => {
                const st = p.scaduto ? { label: 'Scaduto', area: 'fumo' as Area } : STATO_PREVENTIVO[p.stato] ?? { label: p.stato, area: 'fumo' as Area };
                return (
                  <li key={p.id}>
                    <a href={`/p/${p.token}`} target="_blank" rel="noreferrer"
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-ink-3/60 hover:bg-ink-3 px-notch-sm px-3 py-2.5 transition-colors">
                      <span className="text-sm text-chiaro min-w-0">{p.oggetto}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <Etichetta area={st.area}>{st.label}</Etichetta>
                        <span className="font-pixel text-xs text-nebbia tabular-nums">{eur(Number(p.totale))}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </Tile>

        {/* Fatture */}
        <Tile area="soldi" className="md:col-span-4 xl:col-span-8">
          <Titolo area="soldi" icona="moneta">Fatture</Titolo>
          {fatture.length === 0 ? (
            <p className="text-sm text-nebbia">Nessuna fattura disponibile.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {fatture.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-ink-3/60 px-notch-sm px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm text-chiaro">{f.numero ? `Fattura n. ${f.numero}` : 'Fattura'}</p>
                    <p className="text-xs text-fumo mt-0.5">
                      del {dataIt(f.data)}
                      {f.stato === 'parziale' && f.residuo != null ? ` · restano ${eur(Number(f.residuo))}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Etichetta area={f.stato === 'pagata' ? 'fatto' : 'soldi'}>
                      {f.stato === 'pagata' ? 'Pagata' : f.stato === 'parziale' ? 'In parte' : 'Da pagare'}
                    </Etichetta>
                    <span className="font-pixel text-sm text-soldi tabular-nums">{f.importo != null ? eur(Number(f.importo)) : ''}</span>
                    {f.pdf_url && (
                      <a href={f.pdf_url} target="_blank" rel="noreferrer" className="font-pixel text-[11px] text-nebbia hover:text-chiaro">PDF</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/* Messaggi */}
        <Tile area="fumo" className="md:col-span-2 xl:col-span-4">
          <Titolo area="fumo" icona="fumetto">Messaggi</Titolo>
          <p className="text-sm text-nebbia">Presto potrai scrivermi da qui e ritrovare tutta la nostra conversazione in un unico posto.</p>
          {haCanone && (
            <p className="text-xs text-fumo mt-3">
              Intanto, per una richiesta con stima in ore, usa <a href="/canone" className="text-ore hover:underline underline-offset-4">Ore e lavori</a>.
            </p>
          )}
        </Tile>

        {/* I tuoi dati */}
        <Tile area="fumo" className="md:col-span-6 xl:col-span-12">
          <Titolo area="fumo" icona="domanda">I tuoi dati</Titolo>
          <dl className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            <Dato label="Nome" valore={cliente.nome} />
            {cliente.azienda && <Dato label="Azienda" valore={cliente.azienda} />}
            {cliente.email && <Dato label="Email" valore={cliente.email} />}
            {cliente.telefono && <Dato label="Telefono" valore={cliente.telefono} />}
            {cliente.piva && <Dato label="P. IVA" valore={cliente.piva} />}
          </dl>
          <p className="text-xs text-fumo mt-3">Un dato non è corretto? Scrivimi e lo sistemo.</p>
        </Tile>
      </div>
    </PaginaCliente>
  );
}

function Dato({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="bg-ink-3 px-notch-sm px-3 py-2 min-w-0">
      <dt className="text-fumo text-[11px]">{label}</dt>
      <dd className="mt-0.5 text-sm text-chiaro truncate">{valore}</dd>
    </div>
  );
}

// Totale dei lavori come barra di 20 pixel: verdi i versati.
function Riepilogo({ totale, ricevuto, daDare }: { totale: number; ricevuto: number; daDare: number }) {
  const pieni = totale > 0 ? Math.round((ricevuto / totale) * 20) : 0;
  return (
    <>
      <p className="text-xs text-fumo mb-1.5">Ancora da versare</p>
      <p className="font-pixel text-3xl sm:text-4xl text-soldi leading-none tabular-nums mb-4">{eur(daDare)}</p>
      <div className="grid grid-cols-10 gap-[3px] mb-2" role="img" aria-label={`Versati ${eur(ricevuto)} su ${eur(totale)}`}>
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} className={`block h-3 px-pop ${i < pieni ? 'bg-fatto' : 'bg-ink-4'}`} style={{ animationDelay: `${i * 30}ms` }} />
        ))}
      </div>
      <dl className="flex flex-col gap-1.5 text-sm mt-3">
        <div className="flex justify-between gap-2">
          <dt className="text-nebbia flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 bg-fatto" /> Già versato</dt>
          <dd className="font-pixel text-xs text-fatto tabular-nums">{eur(ricevuto)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-nebbia flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 bg-ink-4" /> Totale lavori</dt>
          <dd className="font-pixel text-xs text-chiaro tabular-nums">{eur(totale)}</dd>
        </div>
      </dl>
    </>
  );
}
