'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Avanzamento, Missione, StatoDrill } from '@/lib/scacchi/missioni';
import type { MissioneProgramma } from '@/lib/scacchi/coach';
import { REPERTORIO } from '@/lib/scacchi/repertorio';
import { Motore } from '@/lib/scacchi/motore';
import { analizzaESalva } from '@/lib/scacchi/review-client';

type Props = {
  av: Avanzamento | null;
  programma: MissioneProgramma[];
  storico: Missione[];
  drill: Record<string, StatoDrill>;
  username: string | null;
};

export default function Coach({ av, programma, storico, drill, username }: Props) {
  const router = useRouter();
  const [occupato, setOccupato] = useState<string | null>(null);
  const motore = useRef<Motore | null>(null);

  async function azione(body: object) {
    setOccupato('…');
    const r = await fetch('/api/scacchi/missioni', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    setOccupato(null);
    if (!r.ok) alert(j.error);
    router.refresh();
  }

  async function aggiorna() {
    setOccupato('Importo da chess.com…');
    await fetch('/api/scacchi/importa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setOccupato(null);
    router.refresh();
  }

  async function analizzaTutte() {
    if (!av) return;
    const da = av.partite.filter((p) => !p.analizzata);
    motore.current ??= new Motore();
    for (let i = 0; i < da.length; i++) {
      const p = await fetch(`/api/scacchi/partite/${da[i].id}`).then((r) => r.json());
      await analizzaESalva(motore.current, da[i].id, p.pgn, (x) => setOccupato(`Analizzo partita ${i + 1} di ${da.length}: ${Math.round(x * 100)}%`));
    }
    setOccupato(null);
    router.refresh();
  }

  const fatte = new Set(storico.filter((m) => m.stato === 'completata').map((m) => m.codice));
  const drillMancanti = av?.missione.regole.drill?.filter((id) => !drill[id] || drill[id].livello < 1) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-3 md:p-5 text-sm text-[#c3c2c1]">
      {occupato && <p className="rounded bg-[#3c3a37] px-3 py-2 text-white">{occupato}</p>}

      {!av ? (
        <div className="rounded-lg bg-[#262421] p-5">
          <h1 className="text-xl font-bold text-white">Coach</h1>
          <p className="mt-2">
            Il programma ha 3 missioni. Ognuna è un blocco di partite con regole precise: io controllo se le rispetti, analizzo le partite e ti correggo.
          </p>
          <button onClick={() => azione({ azione: 'attiva_prossima' })} className="mt-4 rounded-lg bg-[#81b64c] px-5 py-3 text-lg font-bold text-white shadow-[0_4px_0_#45753c]">
            Inizia la prossima missione
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-[#262421] p-5">
            <p className="text-xs uppercase tracking-wide text-[#81b64c]">Missione attiva · dal {new Date(av.missione.inizio).toLocaleDateString('it-IT')}</p>
            <h1 className="mt-1 text-xl font-bold text-white">{av.missione.titolo}</h1>
            <p className="mt-2 whitespace-pre-line">{av.missione.descrizione}</p>
            {drillMancanti.length > 0 && (
              <div className="mt-3 rounded border-l-4 border-[#f7c631] bg-[#3a3528] p-3">
                <p className="font-semibold text-white">Prima di giocare completa questi drill (un giro senza errori):</p>
                <ul className="mt-1 list-disc pl-5">
                  {drillMancanti.map((id) => (
                    <li key={id}><Link className="underline hover:text-white" href={`/scacchi/aperture/${id}`}>{REPERTORIO.find((l) => l.id === id)?.titolo}</Link></li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs"><span>Partite</span><span className="font-bold text-white">{av.giocate} / {av.missione.regole.partite}</span></div>
              <div className="h-3 overflow-hidden rounded bg-[#3c3a37]">
                <div className="h-full bg-[#81b64c]" style={{ width: `${Math.min(100, (av.giocate / av.missione.regole.partite) * 100)}%` }} />
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {av.obiettivi.map((o, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${o.ok === true ? 'bg-[#81b64c]' : o.ok === false ? 'bg-[#fa412d]' : 'bg-[#3c3a37]'}`}>
                    {o.ok === true ? '✓' : o.ok === false ? '✕' : '·'}
                  </span>
                  {o.testo}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={aggiorna} disabled={!!occupato || !username} className="rounded bg-[#3c3a37] px-3 py-2 font-semibold text-white hover:bg-[#484644] disabled:opacity-50">Importa nuove partite</button>
              {av.partite.some((p) => !p.analizzata) && (
                <button onClick={analizzaTutte} disabled={!!occupato} className="rounded bg-[#3c3a37] px-3 py-2 font-semibold text-white hover:bg-[#484644] disabled:opacity-50">
                  Analizza le partite ({av.partite.filter((p) => !p.analizzata).length})
                </button>
              )}
              {av.completa && (
                <button onClick={() => azione({ azione: 'chiudi', id: av.missione.id, stato: 'completata' })} className="rounded bg-[#81b64c] px-3 py-2 font-bold text-white">Missione completata: avanti</button>
              )}
              <button onClick={() => confirm('Annullare la missione?') && azione({ azione: 'chiudi', id: av.missione.id, stato: 'annullata' })} className="ml-auto rounded px-3 py-2 text-xs text-[#8b8987] hover:text-white">Annulla missione</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
            <Kpi e="Nel repertorio" v={`${av.inRegola} / ${av.giocate}`} />
            <Kpi e="V / P / N" v={`${av.vinte} / ${av.perse} / ${av.patte}`} />
            <Kpi e="Perse per tempo" v={av.persePerTempo} />
            <Kpi e="Accuratezza media" v={av.accuratezzaMedia ?? '–'} />
            <Kpi e="Errori gravi / partita" v={av.graviMedi ?? '–'} />
          </div>

          {av.missione.feedback && (
            <div className="rounded-lg border-l-4 border-[#5c8bb0] bg-[#2f3a44] p-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#8fb3d1]">Feedback del coach</p>
              <p className="whitespace-pre-line text-[#e8e6e3]">{av.missione.feedback}</p>
            </div>
          )}

          {av.deviazioni.length > 0 && (
            <div className="rounded-lg bg-[#262421] p-4">
              <p className="mb-2 font-bold text-white">Dove esci dal repertorio</p>
              {av.deviazioni.map((d, i) => (
                <p key={i}>Hai giocato <b className="text-[#ffa459]">{d.mossa}</b> invece di <b className="text-[#81b64c]">{d.attesa}</b> ({d.volte} {d.volte === 1 ? 'volta' : 'volte'})</p>
              ))}
            </div>
          )}

          <div className="rounded-lg bg-[#262421]">
            <h2 className="border-b border-[#3c3a37] p-3 font-bold text-white">Partite della missione</h2>
            {av.partite.length === 0 ? (
              <p className="p-5 text-center text-[#8b8987]">
                Nessuna partita ancora. Gioca su chess.com in modalità Rapid (10 minuti), poi premi &quot;Importa nuove partite&quot;.
              </p>
            ) : (
              <div className="divide-y divide-[#3c3a37]">
                {av.partite.map((p) => (
                  <Link key={p.id} href={`/scacchi/partita/${p.id}`} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 px-3 py-2 hover:bg-[#2f2d2a]">
                    <span className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-white ${p.esito_mio === 'vinta' ? 'bg-[#81b64c]' : p.esito_mio === 'persa' ? 'bg-[#fa412d]' : 'bg-[#8b8987]'}`}>
                      {p.esito_mio === 'vinta' ? '+' : p.esito_mio === 'persa' ? '−' : '='}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-white">{p.colore_mio === 'w' ? 'Bianco' : 'Nero'} vs {p.colore_mio === 'w' ? p.nero : p.bianco} <span className="text-xs text-[#8b8987]">{p.apertura}</span></p>
                      <p className="text-xs">
                        {p.aderenza.inRegola ? (
                          <span className="text-[#81b64c]">Repertorio rispettato ({p.aderenza.mosseInRepertorio} mosse)</span>
                        ) : (
                          <span className="text-[#ffa459]">Uscito alla mossa {Math.ceil(p.aderenza.deviazione!.ply / 2)}: {p.aderenza.deviazione!.giocata} invece di {p.aderenza.deviazione!.attesa}</span>
                        )}
                        {p.persaPerTempo && <span className="ml-2 text-[#fa412d]">persa per tempo</span>}
                      </p>
                    </div>
                    <span className="text-right text-xs">
                      {p.analizzata ? <><b className="text-white">{p.accuratezza_mia?.toFixed(1)}</b>{p.gravi ? <span className="ml-1 text-[#fa412d]">{p.gravi}??</span> : null}</> : 'da analizzare'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="rounded-lg bg-[#262421] p-4">
        <p className="mb-2 font-bold text-white">Programma</p>
        <ol className="space-y-1">
          {programma.map((p) => (
            <li key={p.codice} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${fatte.has(p.codice) ? 'bg-[#81b64c]' : av?.missione.codice === p.codice ? 'bg-[#f7c631]' : 'bg-[#3c3a37]'}`} />
              {p.titolo}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-[#8b8987]">In chat con Claude puoi chiedere: &quot;come sta andando la missione?&quot; per il feedback e missioni su misura.</p>
      </div>
    </div>
  );
}

function Kpi({ e, v }: { e: string; v: string | number }) {
  return (
    <div className="rounded-lg bg-[#262421] p-3">
      <div className="text-xs text-[#8b8987]">{e}</div>
      <div className="text-lg font-bold text-white">{v}</div>
    </div>
  );
}
