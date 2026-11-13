'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { euroCent } from '@/lib/formato';
import { fmtMinuti, meseDi, nomeMese, type MeseCanone } from '@/lib/canone-calcolo';
import type { Canone, Intervento, Lavoro, Richiesta, Scadenza } from '@/lib/canone';

interface Props {
  cliente: { nome: string; azienda: string | null };
  oggi: string;
  canone: Canone;
  mesi: MeseCanone[];
  corrente: MeseCanone | null;
  interventi: Intervento[];
  lavori: Lavoro[];
  richieste: Richiesta[];
  pagamenti: Scadenza[];
}

const giorno = (d: string | null, anno = false) =>
  d
    ? new Date(`${d}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', ...(anno && { year: 'numeric' }) })
    : '';

const giorniTra = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);

const aggiungiGiorni = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

const ore = (n: number | null) => (n == null ? '' : `${String(n).replace('.', ',')} h`);

const STATO_LAVORO: Record<string, { label: string; barra: string; badge: string }> = {
  da_avviare: { label: 'Da avviare', barra: 'bg-zinc-500/50', badge: 'bg-zinc-500/15 text-muted' },
  in_corso: { label: 'In corso', barra: 'bg-sky-500', badge: 'bg-sky-500/15 text-sky-400' },
  attesa_cliente: { label: 'Aspetto qualcosa da voi', barra: 'bg-amber-500', badge: 'bg-amber-500/15 text-amber-400' },
  completato: { label: 'Completato', barra: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400' },
};

const STATO_RICHIESTA: Record<string, { label: string; badge: string }> = {
  nuova: { label: 'In valutazione', badge: 'bg-zinc-500/15 text-muted' },
  stimata: { label: 'Da approvare', badge: 'bg-accent text-on-accent' },
  approvata: { label: 'Approvata, in lavorazione', badge: 'bg-sky-500/15 text-sky-400' },
  rifiutata: { label: 'Non approvata', badge: 'bg-zinc-500/15 text-dim' },
  completata: { label: 'Fatta', badge: 'bg-emerald-500/15 text-emerald-400' },
};

const card = 'bg-surface border border-edge rounded-2xl p-4 sm:p-5 min-w-0';

export default function CanonePagina(p: Props) {
  const router = useRouter();
  const { canone, corrente, oggi } = p;

  const esci = async () => {
    await fetch('/api/portale/esci', { method: 'POST' });
    window.location.href = '/accedi';
  };

  const daApprovare = p.richieste.filter((r) => r.stato === 'stimata');
  const aperte = p.richieste.filter((r) => r.stato === 'nuova' || r.stato === 'approvata');
  const attese = p.lavori.filter((l) => l.stato === 'attesa_cliente' && l.attesa_cliente);

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-edge bg-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <img src="/Logo.svg" alt="MAURO DEV" className="h-6 w-auto logo-adaptive" />
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <span className="text-sm text-muted truncate hidden sm:block">{p.cliente.azienda || p.cliente.nome}</span>
            <a href="/portale" className="text-xs text-dim hover:text-text transition-colors shrink-0">
              Preventivi e fatture
            </a>
            <button onClick={esci} className="text-xs text-dim hover:text-text transition-colors shrink-0">
              Esci
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <h1 className="text-xl sm:text-2xl font-semibold leading-tight mb-1">Ciao {p.cliente.nome.split(' ')[0]}</h1>
        <p className="text-muted text-sm mb-6">Ore, lavori in corso e scadenze, aggiornati a ogni intervento.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Monte ore */}
          {corrente && <MonteOre canone={canone} mese={corrente} oggi={oggi} />}

          {/* Cose da fare per il cliente */}
          {(daApprovare.length > 0 || attese.length > 0) && (
            <section className={`md:col-span-3 ${card}`}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold">Serve qualcosa da voi</h2>
                <span className="text-xs bg-accent text-on-accent rounded-full px-2 py-0.5">{daApprovare.length + attese.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {daApprovare.map((r) => (
                  <StimaDaApprovare key={r.id} r={r} onFatto={() => router.refresh()} />
                ))}
                {attese.map((l) => (
                  <div key={l.id} className="bg-surface2 rounded-xl px-4 py-3">
                    <p className="text-sm font-medium">{l.titolo}{l.sito ? <span className="text-dim font-normal"> · {l.sito}</span> : null}</p>
                    <p className="text-sm text-muted mt-0.5 whitespace-pre-wrap">{l.attesa_cliente}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          <section className={`md:col-span-3 ${card}`}>
            <h2 className="font-semibold mb-1">Lavori e consegne</h2>
            <p className="text-xs text-dim mb-4">Le date di consegna sono stime: se cambiano, le aggiorno qui.</p>
            <Timeline lavori={p.lavori} oggi={oggi} />
          </section>

          {/* Registro interventi */}
          <section className={`md:col-span-2 md:self-start ${card}`}>
            <RegistroInterventi interventi={p.interventi} siti={canone.siti} meseCorrente={meseDi(oggi)} />
          </section>

          {/* Pagamenti + richieste */}
          <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
            <section className={card}>
              <h2 className="font-semibold mb-3">Pagamenti</h2>
              <Pagamenti pagamenti={p.pagamenti} />
            </section>
            <section className={card}>
              <h2 className="font-semibold mb-1">Nuova richiesta</h2>
              <p className="text-xs text-dim mb-3">
                Facoltativo: puoi continuare a scrivermi via mail o messaggio. Da qui ti rispondo con una stima in ore prima di partire.
              </p>
              <NuovaRichiesta siti={canone.siti} onFatto={() => router.refresh()} />
              {aperte.length > 0 && (
                <ul className="flex flex-col gap-2 mt-4">
                  {aperte.map((r) => (
                    <li key={r.id} className="bg-surface2 rounded-xl px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-dim truncate">{r.sito || 'Richiesta'} · {giorno(r.creata_il?.slice(0, 10) ?? null)}</span>
                        <span className={`text-[11px] rounded-full px-2 py-0.5 shrink-0 ${STATO_RICHIESTA[r.stato].badge}`}>{STATO_RICHIESTA[r.stato].label}</span>
                      </div>
                      <p className="text-sm mt-1 line-clamp-3 whitespace-pre-wrap">{r.testo}</p>
                      {r.ore_stimate != null && <p className="text-xs text-dim mt-1">Stima: {ore(r.ore_stimate)}{r.consegna_prevista ? ` · consegna ${giorno(r.consegna_prevista)}` : ''}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Storico */}
          {p.mesi.length > 0 && (
            <section className={`md:col-span-3 ${card}`}>
              <h2 className="font-semibold mb-3">Mese per mese</h2>
              <Storico mesi={p.mesi} />
            </section>
          )}

          {/* Condizioni */}
          <section className={`md:col-span-3 ${card}`}>
            <h2 className="font-semibold mb-2">Come funziona</h2>
            <ul className="text-sm text-muted flex flex-col gap-1 list-disc pl-5">
              <li>
                Canone di {euroCent(canone.prezzo_mese)} al mese per {ore(canone.ore_mese)}, usabili su tutti i vostri siti.
              </li>
              <li>
                Le ore non usate passano al mese dopo e valgono {canone.riporto_mesi === 1 ? 'per quel mese' : `per ${canone.riporto_mesi} mesi`}: si usano per prime.
              </li>
              <li>Oltre le ore disponibili, le ore in più sono a {euroCent(canone.tariffa_extra)} l&apos;ora.</li>
              <li>I lavori indicati come &quot;fuori canone&quot; hanno un preventivo o un prezzo a parte e non consumano ore.</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}

// ── Monte ore del mese ──

function MonteOre({ canone, mese, oggi }: { canone: Canone; mese: MeseCanone; oggi: string }) {
  const disponibili = mese.incluse + mese.riportate;
  const base = Math.max(disponibili, mese.usate, 1);
  const pct = (m: number) => `${(m / base) * 100}%`;
  const usateDisp = mese.da_riporto + mese.da_incluse;
  const poche = mese.rimaste > 0 && mese.rimaste < 120;
  const fineMese = new Date(`${oggi}T12:00:00`);
  const giorniAllaFine = new Date(fineMese.getFullYear(), fineMese.getMonth() + 1, 0).getDate() - fineMese.getDate();

  return (
    <section className={`md:col-span-3 ${card}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="font-semibold">Ore di {nomeMese(mese.mese)}</h2>
        <span className="text-xs text-dim">
          {giorniAllaFine === 0 ? 'ultimo giorno del mese' : `${giorniAllaFine} giorni alla fine del mese`}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-1 mb-4">
        <p className="text-3xl sm:text-4xl font-semibold tabular-nums leading-none">
          {fmtMinuti(mese.rimaste)}
          <span className="text-base font-normal text-muted"> rimaste su {fmtMinuti(disponibili)}</span>
        </p>
        {mese.extra > 0 && (
          <p className="text-sm text-amber-400">
            + {fmtMinuti(mese.extra)} extra ({euroCent(mese.costo_extra)})
          </p>
        )}
      </div>

      <div className="h-3 rounded-full bg-surface2 overflow-hidden flex" role="img"
        aria-label={`Usate ${fmtMinuti(mese.usate)} su ${fmtMinuti(disponibili)}`}>
        <div className="bg-sky-500" style={{ width: pct(usateDisp) }} />
        {mese.extra > 0 && <div className="bg-amber-500" style={{ width: pct(mese.extra) }} />}
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 text-sm">
        <Dato label="Del canone" valore={fmtMinuti(mese.incluse)} />
        <Dato label="Dal mese prima" valore={fmtMinuti(mese.riportate)} />
        <Dato label="Usate" valore={fmtMinuti(mese.usate)} />
        <Dato label="Rimaste" valore={fmtMinuti(mese.rimaste)} forte />
        <Dato label="Fuori canone" valore={fmtMinuti(mese.fuori_canone)} />
      </dl>

      {(mese.scadono > 0 || poche) && (
        <p className="text-xs text-muted mt-4 bg-surface2 rounded-lg px-3 py-2">
          {poche && <>Restano meno di 2 ore questo mese: oltre, le ore sono a {euroCent(canone.tariffa_extra)}. </>}
          {mese.scadono > 0 && (
            <>
              {fmtMinuti(mese.scadono)} arrivano dal mese scorso e scadono a fine {nomeMese(mese.mese).split(' ')[0]}.
            </>
          )}
        </p>
      )}
      {mese.riporto_prossimo > 0 && (
        <p className="text-xs text-dim mt-2">Se non le usate, {fmtMinuti(mese.riporto_prossimo)} passano al mese prossimo.</p>
      )}
    </section>
  );
}

function Dato({ label, valore, forte }: { label: string; valore: string; forte?: boolean }) {
  return (
    <div>
      <dt className="text-dim text-xs">{label}</dt>
      <dd className={`mt-0.5 tabular-nums ${forte ? 'font-semibold' : ''}`}>{valore}</dd>
    </div>
  );
}

// ── Timeline ──

function Timeline({ lavori, oggi }: { lavori: Lavoro[]; oggi: string }) {
  const [mostraFatti, setMostraFatti] = useState(false);
  const fatti = lavori.filter((l) => l.stato === 'completato');
  const visibili = lavori.filter((l) => mostraFatti || l.stato !== 'completato');

  const { da, a } = useMemo(() => {
    const date = visibili.flatMap((l) => [l.inizio, l.consegna_prevista, l.completato_il]).filter(Boolean) as string[];
    let da = aggiungiGiorni(oggi, -14);
    let a = aggiungiGiorni(oggi, 30);
    for (const d of date) {
      if (d < da) da = d;
      if (d > a) a = d;
    }
    return { da, a: aggiungiGiorni(a, 3) };
  }, [visibili, oggi]);

  if (lavori.length === 0) return <p className="text-muted text-sm">Nessun lavoro in corso al momento.</p>;

  const span = Math.max(1, giorniTra(da, a));
  const x = (d: string) => Math.min(100, Math.max(0, (giorniTra(da, d) / span) * 100));

  // Etichette dei mesi lungo l'asse.
  const tacche: { pos: number; label: string }[] = [];
  for (let m = `${meseDi(da)}-01`; m <= a; ) {
    if (m >= da) tacche.push({ pos: x(m), label: new Date(`${m}T12:00:00`).toLocaleDateString('it-IT', { month: 'short' }) });
    const d = new Date(`${m}T12:00:00`);
    d.setMonth(d.getMonth() + 1);
    m = d.toISOString().slice(0, 10).replace(/-\d{2}$/, '-01');
  }

  return (
    <div>
      <div className="relative h-5 ml-0 md:ml-[34%] text-[11px] text-dim mb-1">
        {tacche.map((t) => (
          <span key={t.label + t.pos} className="absolute -translate-x-1/2" style={{ left: `${t.pos}%` }}>{t.label}</span>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {visibili.map((l) => {
          const st = STATO_LAVORO[l.stato] ?? STATO_LAVORO.da_avviare;
          const inizio = l.inizio ?? (l.consegna_prevista && l.consegna_prevista < oggi ? l.consegna_prevista : oggi);
          const fine = l.completato_il ?? l.consegna_prevista;
          const mancano = l.consegna_prevista && l.stato !== 'completato' ? giorniTra(oggi, l.consegna_prevista) : null;
          return (
            <li key={l.id} className="md:grid md:grid-cols-[34%_1fr] md:items-center gap-3">
              <div className="min-w-0 mb-1.5 md:mb-0 md:pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{l.titolo}</p>
                  <span className={`text-[11px] rounded-full px-2 py-0.5 ${st.badge}`}>{st.label}</span>
                </div>
                <p className="text-xs text-dim mt-0.5">
                  {[
                    l.sito,
                    l.stato === 'completato' && l.completato_il
                      ? `consegnato il ${giorno(l.completato_il)}`
                      : l.consegna_prevista
                        ? `consegna stimata ${giorno(l.consegna_prevista)}${
                            mancano == null ? '' : mancano > 0 ? `, tra ${mancano} ${mancano === 1 ? 'giorno' : 'giorni'}` : mancano === 0 ? ', oggi' : ', in ritardo'
                          }`
                        : 'data da definire',
                    l.ore_stimate != null && `${fmtMinuti(l.minuti_usati)} di circa ${ore(l.ore_stimate)}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="relative h-6 bg-surface2/60 rounded-md">
                <div className="absolute top-0 bottom-0 w-px bg-accent z-10" style={{ left: `${x(oggi)}%` }} title="Oggi" />
                {fine ? (
                  <div
                    className={`absolute top-1 bottom-1 rounded ${st.barra}`}
                    style={{ left: `${x(inizio)}%`, width: `max(6px, ${x(fine) - x(inizio)}%)` }}
                    title={`${giorno(inizio, true)} → ${giorno(fine, true)}`}
                  />
                ) : (
                  <div className={`absolute top-1 bottom-1 w-2 rounded-full ${st.barra}`} style={{ left: `${x(inizio)}%` }} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-3 mt-3">
        <p className="text-[11px] text-dim flex items-center gap-1.5">
          <span className="inline-block w-px h-3 bg-accent" /> oggi
        </p>
        {fatti.length > 0 && (
          <button onClick={() => setMostraFatti((v) => !v)} className="text-xs text-dim hover:text-text transition-colors">
            {mostraFatti ? 'Nascondi i completati' : `Mostra i completati (${fatti.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Registro interventi ──

function RegistroInterventi({ interventi, siti, meseCorrente }: { interventi: Intervento[]; siti: string[]; meseCorrente: string }) {
  const mesi = useMemo(() => Array.from(new Set([meseCorrente, ...interventi.map((i) => meseDi(i.data))])).sort().reverse(), [interventi, meseCorrente]);
  const tuttiSiti = useMemo(
    () => Array.from(new Set([...siti, ...(interventi.map((i) => i.sito).filter(Boolean) as string[])])),
    [siti, interventi]
  );
  const [mese, setMese] = useState(meseCorrente);
  const [sito, setSito] = useState('');

  const righe = interventi.filter((i) => meseDi(i.data) === mese && (!sito || i.sito === sito));
  const totale = righe.filter((i) => !i.fuori_canone).reduce((s, i) => s + i.minuti, 0);

  const sel = 'bg-surface2 border border-edge rounded-lg px-2 py-1 text-xs text-text';
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="font-semibold">Interventi</h2>
        <div className="flex items-center gap-2">
          <select value={mese} onChange={(e) => setMese(e.target.value)} className={sel} aria-label="Mese">
            {mesi.map((m) => (
              <option key={m} value={m}>{nomeMese(m)}</option>
            ))}
          </select>
          {tuttiSiti.length > 1 && (
            <select value={sito} onChange={(e) => setSito(e.target.value)} className={sel} aria-label="Sito">
              <option value="">Tutti i siti</option>
              {tuttiSiti.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      {righe.length === 0 ? (
        <p className="text-muted text-sm">Nessun intervento in questo periodo.</p>
      ) : (
        <>
          <ul className="divide-y divide-edge">
            {righe.map((i) => (
              <li key={i.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm whitespace-pre-wrap">{i.descrizione}</p>
                  <p className="text-xs text-dim mt-0.5">
                    {[giorno(i.data), i.sito, i.richiesto_da && `chiesto da ${i.richiesto_da}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm tabular-nums">{fmtMinuti(i.minuti)}</p>
                  {i.fuori_canone && <p className="text-[11px] text-dim">fuori canone</p>}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-dim mt-2 text-right">
            Totale a canone{sito ? ` su ${sito}` : ''}: <span className="text-text tabular-nums">{fmtMinuti(totale)}</span>
          </p>
        </>
      )}
    </>
  );
}

// ── Pagamenti ──

function Pagamenti({ pagamenti }: { pagamenti: Scadenza[] }) {
  if (pagamenti.length === 0) return <p className="text-muted text-sm">Niente in sospeso.</p>;
  const etichetta = { fattura: 'Da pagare', tranche: 'Da fatturare', canone: 'Questo mese' } as const;
  return (
    <ul className="flex flex-col gap-2">
      {pagamenti.map((s, k) => (
        <li key={k} className="bg-surface2 rounded-xl px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm min-w-0">{s.descrizione}</p>
            <p className="text-sm tabular-nums shrink-0 font-medium">{euroCent(s.importo)}</p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-dim">{etichetta[s.tipo]}{s.data ? ` · del ${giorno(s.data, true)}` : ''}</p>
            {s.pdf_url && (
              <a href={s.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">PDF</a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Storico ──

function Storico({ mesi }: { mesi: MeseCanone[] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="text-xs text-dim text-left">
            <th className="font-normal px-1 py-1.5">Mese</th>
            <th className="font-normal px-1 py-1.5 text-right">Riportate</th>
            <th className="font-normal px-1 py-1.5 text-right">Usate</th>
            <th className="font-normal px-1 py-1.5 text-right">Extra</th>
            <th className="font-normal px-1 py-1.5 text-right">Scadute</th>
            <th className="font-normal px-1 py-1.5 text-right">Al mese dopo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge">
          {[...mesi].reverse().map((m) => (
            <tr key={m.mese} className="tabular-nums">
              <td className="px-1 py-2 capitalize">{nomeMese(m.mese)}</td>
              <td className="px-1 py-2 text-right">{m.riportate ? fmtMinuti(m.riportate) : '-'}</td>
              <td className="px-1 py-2 text-right">{fmtMinuti(m.usate)}</td>
              <td className="px-1 py-2 text-right">{m.extra ? `${fmtMinuti(m.extra)} (${euroCent(m.costo_extra)})` : '-'}</td>
              <td className="px-1 py-2 text-right">{m.scadono ? fmtMinuti(m.scadono) : '-'}</td>
              <td className="px-1 py-2 text-right">{fmtMinuti(m.riporto_prossimo)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Richieste ──

function NuovaRichiesta({ siti, onFatto }: { siti: string[]; onFatto: () => void }) {
  const [testo, setTesto] = useState('');
  const [sito, setSito] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [stato, setStato] = useState<'idle' | 'invio' | 'ok' | string>('idle');

  const invia = async (e: React.FormEvent) => {
    e.preventDefault();
    setStato('invio');
    const res = await fetch('/api/portale/richieste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testo, sito: sito || null, urgente }),
    });
    if (res.ok) {
      setTesto('');
      setSito('');
      setUrgente(false);
      setStato('ok');
      onFatto();
    } else {
      setStato((await res.json().catch(() => ({}))).error || 'Invio non riuscito, riprova.');
    }
  };

  const campo = 'w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text placeholder:text-dim';
  return (
    <form onSubmit={invia} className="flex flex-col gap-2">
      {siti.length > 0 && (
        <select value={sito} onChange={(e) => setSito(e.target.value)} className={campo} aria-label="Sito">
          <option value="">Su quale sito?</option>
          {siti.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="Altro">Altro</option>
        </select>
      )}
      <textarea
        value={testo}
        onChange={(e) => {
          setTesto(e.target.value);
          if (stato === 'ok') setStato('idle');
        }}
        rows={4}
        required
        minLength={3}
        placeholder="Cosa serve? Link, pagine, testi, scadenze…"
        className={campo}
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} /> È urgente
      </label>
      <button
        type="submit"
        disabled={stato === 'invio' || testo.trim().length < 3}
        className="text-sm px-3 py-2 rounded-lg bg-accent text-on-accent font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {stato === 'invio' ? 'Invio…' : 'Invia richiesta'}
      </button>
      {stato === 'ok' && <p className="text-xs text-emerald-400">Ricevuta. Ti rispondo con una stima.</p>}
      {stato !== 'idle' && stato !== 'invio' && stato !== 'ok' && <p className="text-xs text-red-400">{stato}</p>}
    </form>
  );
}

function StimaDaApprovare({ r, onFatto }: { r: Richiesta; onFatto: () => void }) {
  const [busy, setBusy] = useState(false);
  const decidi = async (azione: 'approva' | 'rifiuta') => {
    setBusy(true);
    try {
      const res = await fetch(`/api/portale/richieste/${r.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ azione }),
      });
      if (res.ok) onFatto();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="bg-surface2 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">
          Stima: {ore(r.ore_stimate)}
          {r.consegna_prevista && <span className="font-normal text-muted"> · consegna {giorno(r.consegna_prevista)}</span>}
          {r.sito && <span className="font-normal text-dim"> · {r.sito}</span>}
        </p>
        <p className="text-sm text-muted mt-0.5 line-clamp-2 whitespace-pre-wrap">{r.testo}</p>
        {r.risposta && <p className="text-xs text-dim mt-1 whitespace-pre-wrap">{r.risposta}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button disabled={busy} onClick={() => decidi('rifiuta')}
          className="text-xs px-3 py-1.5 rounded-lg border border-edge text-dim hover:text-text transition-colors disabled:opacity-50">
          Non ora
        </button>
        <button disabled={busy} onClick={() => decidi('approva')}
          className="text-xs px-3 py-1.5 rounded-lg bg-accent text-on-accent hover:opacity-90 transition-opacity disabled:opacity-50">
          Approva
        </button>
      </div>
    </div>
  );
}
