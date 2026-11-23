'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import type { Esiti, Statistiche } from '@/lib/scacchi/statistiche';
import { Motore } from '@/lib/scacchi/motore';
import { analizzaESalva } from '@/lib/scacchi/review-client';

const pct = (x: number, n: number) => (n ? Math.round((x / n) * 100) : 0);
const FINALI: Record<string, string> = {
  matto: 'Scacco matto', abbandono: 'Abbandono', tempo: 'Tempo scaduto', abbandonata: 'Partita abbandonata',
  accordo: 'Accordo', ripetizione: 'Ripetizione', stallo: 'Stallo', 'materiale insufficiente': 'Materiale insufficiente', '50 mosse': 'Regola delle 50 mosse', altro: 'Altro',
};
const CADENZE: Record<string, string> = { bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', daily: 'Giornaliera', bot: 'Bot' };

export default function StatisticheScacchi({ s, username }: { s: Statistiche; username: string | null }) {
  const router = useRouter();
  const [stato, setStato] = useState<string | null>(null);
  const stop = useRef(false);
  const motore = useRef<Motore | null>(null);

  async function importaTutto() {
    stop.current = false;
    setStato('Leggo l\'elenco dei mesi da chess.com…');
    const r = await fetch('/api/scacchi/importa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ azione: 'elenco' }) });
    const { archivi, error } = await r.json();
    if (error) return setStato(error);
    let importate = 0;
    for (let i = 0; i < archivi.length && !stop.current; i += 2) {
      const blocco = archivi.slice(i, i + 2);
      setStato(`Importo ${blocco.map((a: string) => a.split('/games/')[1]).join(', ')} (${Math.min(i + 2, archivi.length)}/${archivi.length} mesi, ${importate} partite nuove)`);
      const e = await fetch('/api/scacchi/importa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ azione: 'blocco', archivi: blocco }) }).then((x) => x.json());
      importate += e.importate ?? 0;
    }
    if (!stop.current) await fetch('/api/scacchi/importa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ azione: 'fine', ultimo: archivi[archivi.length - 1] }) });
    setStato(`Import finito: ${importate} partite nuove.`);
    router.refresh();
  }

  async function analizzaUltime() {
    stop.current = false;
    const { partite } = await fetch('/api/scacchi/partite?limite=100').then((x) => x.json());
    const da = (partite as { id: number; analizzata: boolean; versione_review?: number; colore_mio: string | null }[]).filter((p) => p.colore_mio && (!p.analizzata || (p.versione_review ?? 1) < 2));
    motore.current ??= new Motore();
    for (let i = 0; i < da.length && !stop.current; i++) {
      const p = await fetch(`/api/scacchi/partite/${da[i].id}`).then((x) => x.json());
      await analizzaESalva(motore.current, da[i].id, p.pgn, (x) => setStato(`Analizzo partita ${i + 1} di ${da.length}: ${Math.round(x * 100)}%. Puoi interrompere e riprendere quando vuoi.`));
    }
    setStato(stop.current ? 'Analisi interrotta: riprendi quando vuoi.' : `Analisi finita (${da.length} partite).`);
    router.refresh();
  }

  const consigli = useMemo(() => consigliCoach(s), [s]);
  const ap = (c: 'w' | 'b') => s.aperture.filter((a) => a.colore === c && a.esiti.n >= 5).slice(0, 10);
  const persi = Object.entries(s.comePerdo).sort((a, b) => b[1] - a[1]);
  const totPerse = persi.reduce((x, [, n]) => x + n, 0);
  const cadenzaPrincipale = Object.entries(s.perCadenza).filter(([c]) => c !== 'bot').sort((a, b) => b[1].n - a[1].n)[0]?.[0] ?? 'blitz';
  const [cadenza, setCadenza] = useState(cadenzaPrincipale);
  const serie = s.ratingMensile.filter((m) => m.cadenza === cadenza);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-3 text-sm text-[#c3c2c1] md:p-5">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[#262421] p-4">
        <div className="mr-auto">
          <h1 className="text-xl font-bold text-white">Le tue statistiche</h1>
          <p>{s.totale.n} partite importate · {s.analizzate} analizzate dal motore</p>
        </div>
        <button onClick={importaTutto} disabled={!!stato && !stato.includes('finit') && !stato.includes('interrott') || !username} className="rounded bg-[#3c3a37] px-3 py-2 font-semibold text-white hover:bg-[#484644] disabled:opacity-50">
          Importa tutto lo storico
        </button>
        <button onClick={analizzaUltime} disabled={!!stato && !stato.includes('finit') && !stato.includes('interrott')} className="rounded bg-[#81b64c] px-3 py-2 font-semibold text-white hover:bg-[#a3d160] disabled:opacity-50">
          Analizza le ultime 100
        </button>
        {stato && !stato.includes('finit') && !stato.includes('interrott') && (
          <button onClick={() => { stop.current = true; }} className="rounded px-3 py-2 text-xs text-[#8b8987] hover:text-white">Interrompi</button>
        )}
        {stato && <p className="w-full rounded bg-[#3c3a37] px-3 py-2 text-white">{stato}</p>}
      </div>

      {consigli.length > 0 && (
        <div className="rounded-lg border-l-4 border-[#81b64c] bg-[#2f3a2a] p-4">
          <p className="mb-1 font-bold text-white">Cosa dicono i numeri</p>
          <ul className="list-disc space-y-1 pl-5">{consigli.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-center md:grid-cols-4">
        <Kpi e="Partite" v={s.totale.n} />
        <Kpi e="Vittorie" v={`${pct(s.totale.v, s.totale.n)}%`} />
        <Kpi e={`Rating ${CADENZE[cadenzaPrincipale] ?? cadenzaPrincipale} (ultimo mese)`} v={serie.at(-1)?.rating ?? '–'} />
        <Kpi e="Accuratezza media" v={s.errori.accuratezzaMedia ?? '–'} />
      </div>

      <div className="rounded-lg bg-[#262421] p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-bold text-white">Rating medio per mese</h2>
          {Object.keys(s.perCadenza).filter((c) => c !== 'bot' && s.ratingMensile.some((m) => m.cadenza === c)).map((c) => (
            <button key={c} onClick={() => setCadenza(c)} className={`rounded px-2 py-1 text-xs ${cadenza === c ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37]'}`}>{CADENZE[c] ?? c}</button>
          ))}
        </div>
        <GraficoRating serie={serie} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(['w', 'b'] as const).map((c) => (
          <div key={c} className="rounded-lg bg-[#262421] p-4">
            <h2 className="mb-2 font-bold text-white">Aperture col {c === 'w' ? 'Bianco' : 'Nero'} <span className="text-xs font-normal text-[#8b8987]">(almeno 5 partite)</span></h2>
            <table className="w-full">
              <tbody>
                {ap(c).map((a) => (
                  <tr key={a.famiglia} className="border-t border-[#3c3a37]">
                    <td className="py-1.5 pr-2 text-white">{a.famiglia}{debole(a.esiti) && <span className="ml-2 rounded bg-[#5a2a24] px-1.5 text-[10px] font-bold text-[#ffb3a8]">DA LAVORARE</span>}</td>
                    <td className="w-12 text-right text-xs">{a.esiti.n}</td>
                    <td className="w-40 pl-3"><BarraEsiti e={a.esiti} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-[#262421] p-4">
          <h2 className="mb-2 font-bold text-white">Come perdi</h2>
          {persi.map(([k, n]) => (
            <div key={k} className="mb-1.5">
              <div className="flex justify-between text-xs"><span className="text-white">{FINALI[k] ?? k}</span><span>{n} · {pct(n, totPerse)}%</span></div>
              <div className="mt-0.5 h-2 rounded bg-[#3c3a37]"><div className="h-2 rounded bg-[#c3c2c1]" style={{ width: `${pct(n, totPerse)}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-[#262421] p-4">
          <h2 className="mb-2 font-bold text-white">Per cadenza</h2>
          {Object.entries(s.perCadenza).sort((a, b) => b[1].n - a[1].n).map(([c, e]) => (
            <div key={c} className="mb-2"><div className="flex justify-between text-xs"><span className="text-white">{CADENZE[c] ?? c}</span><span>{e.n} partite</span></div><BarraEsiti e={e} /></div>
          ))}
        </div>
        <div className="rounded-lg bg-[#262421] p-4">
          <h2 className="mb-2 font-bold text-white">Quando giochi</h2>
          {s.perFascia.filter((f) => f.esiti.n > 0).map((f) => (
            <div key={f.fascia} className="mb-2"><div className="flex justify-between text-xs"><span className="text-white">{f.fascia}</span><span>{f.esiti.n} partite</span></div><BarraEsiti e={f.esiti} /></div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-[#262421] p-4">
        <h2 className="font-bold text-white">Errori per fase</h2>
        <p className="mb-2 text-xs text-[#8b8987]">Sulle {s.analizzate} partite analizzate, ogni 100 tue mosse. Apertura: prime 10 mosse. Finale: pochi pezzi rimasti.</p>
        {s.analizzate === 0 ? (
          <p>Ancora nessuna partita analizzata: premi &quot;Analizza le ultime 100&quot;.</p>
        ) : (
          <>
            <table className="w-full text-center">
              <thead className="text-xs text-[#8b8987]"><tr><th className="text-left font-normal">Fase</th><th className="font-normal">Mosse</th><th className="font-normal">Imprecisioni</th><th className="font-normal">Errori</th><th className="font-normal">Errori gravi</th></tr></thead>
              <tbody>
                {(['apertura', 'mediogioco', 'finale'] as const).map((f) => {
                  const x = s.errori.perFase[f];
                  const per100 = (n: number) => (x.mosse ? ((n / x.mosse) * 100).toFixed(1) : '–');
                  return (
                    <tr key={f} className="border-t border-[#3c3a37]">
                      <td className="py-1.5 text-left capitalize text-white">{f}</td>
                      <td>{x.mosse}</td>
                      <td className="text-[#f7c631]">{per100(x.imprecisioni)}</td>
                      <td className="text-[#ffa459]">{per100(x.errori)}</td>
                      <td className="font-bold text-[#fa412d]">{per100(x.gravi)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Kpi e="Matti mancati" v={s.errori.mattiMancati} />
              <Kpi e="Partite vinte buttate (eri all'85%)" v={s.errori.vantaggiButtati} />
              <Kpi e="Perse per tempo in vantaggio" v={s.errori.persePerTempoInVantaggio} />
            </div>
            <p className="mt-3"><Link href="/scacchi/puzzle" className="font-semibold text-[#81b64c] underline">Allenati sui tuoi errori con i puzzle →</Link></p>
          </>
        )}
      </div>
    </div>
  );
}

function debole(e: Esiti) {
  return e.n >= 10 && pct(e.v, e.n) < 45;
}

/** Tre frasi dai numeri, senza interpretazioni inventate. */
function consigliCoach(s: Statistiche): string[] {
  const out: string[] = [];
  const deboli = s.aperture.filter((a) => debole(a.esiti)).sort((a, b) => b.esiti.n - a.esiti.n).slice(0, 2);
  for (const d of deboli) out.push(`Col ${d.colore === 'w' ? 'Bianco' : 'Nero'}, nelle partite di ${d.famiglia}, vinci solo il ${pct(d.esiti.v, d.esiti.n)}% (${d.esiti.n} partite).`);
  const perse = Object.values(s.comePerdo).reduce((x, y) => x + y, 0);
  if (perse && (s.comePerdo.tempo ?? 0) / perse >= 0.2) out.push(`Il ${pct(s.comePerdo.tempo ?? 0, perse)}% delle sconfitte arriva dal tempo scaduto: gioca a 10 minuti e decidi più in fretta nelle posizioni semplici.`);
  if (s.analizzate >= 10) {
    const f = (['apertura', 'mediogioco', 'finale'] as const)
      .map((k) => ({ k, r: s.errori.perFase[k].mosse ? s.errori.perFase[k].gravi / s.errori.perFase[k].mosse : 0 }))
      .sort((a, b) => b.r - a.r)[0];
    if (f.r > 0) out.push(`Gli errori gravi sono più frequenti in ${f.k} (${(f.r * 100).toFixed(1)} ogni 100 mosse).`);
    if (s.errori.vantaggiButtati) out.push(`${s.errori.vantaggiButtati} partite analizzate non vinte dopo essere stato all'85% di probabilità di vittoria.`);
  }
  return out.slice(0, 4);
}

function Kpi({ e, v }: { e: string; v: string | number }) {
  return (
    <div className="rounded-lg bg-[#262421] p-3 text-center sm:bg-[#2f2d2a]">
      <div className="text-xs text-[#8b8987]">{e}</div>
      <div className="text-xl font-bold text-white">{v}</div>
    </div>
  );
}

/** Barra vittorie/patte/sconfitte con percentuali scritte (il colore non è l'unica informazione). */
function BarraEsiti({ e }: { e: Esiti }) {
  return (
    <div>
      <div className="flex h-2.5 gap-[2px] overflow-hidden rounded">
        <div className="bg-[#81b64c]" style={{ width: `${pct(e.v, e.n)}%` }} />
        <div className="bg-[#8b8987]" style={{ width: `${pct(e.x, e.n)}%` }} />
        <div className="bg-[#fa412d]" style={{ width: `${pct(e.p, e.n)}%` }} />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px]">
        <span>V {pct(e.v, e.n)}%</span><span>P {pct(e.p, e.n)}%</span>
      </div>
    </div>
  );
}

function GraficoRating({ serie }: { serie: { mese: string; rating: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (serie.length < 2) return <p className="text-[#8b8987]">Servono almeno due mesi di partite.</p>;
  const W = 800, H = 200, P = 34;
  const min = Math.floor(Math.min(...serie.map((x) => x.rating)) / 50) * 50;
  const max = Math.ceil(Math.max(...serie.map((x) => x.rating)) / 50) * 50;
  const x = (i: number) => P + (i / (serie.length - 1)) * (W - P - 8);
  const y = (r: number) => 8 + (1 - (r - min) / Math.max(max - min, 1)) * (H - 30);
  const tacche = [min, Math.round((min + max) / 2), max];
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(serie.length - 1, Math.round(((px - P) / (W - P - 8)) * (serie.length - 1)))));
        }}>
        {tacche.map((t) => (
          <g key={t}>
            <line x1={P} x2={W - 8} y1={y(t)} y2={y(t)} stroke="#3c3a37" strokeWidth="1" />
            <text x={P - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8b8987">{t}</text>
          </g>
        ))}
        {[0, Math.floor((serie.length - 1) / 2), serie.length - 1].map((i, k) => (
          <text key={i} x={x(i)} y={H - 4} textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'} fontSize="11" fill="#8b8987">{serie[i].mese}</text>
        ))}
        <polyline fill="none" stroke="#81b64c" strokeWidth="2" strokeLinejoin="round" points={serie.map((m, i) => `${x(i)},${y(m.rating)}`).join(' ')} />
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={8} y2={H - 22} stroke="#8b8987" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(serie[hover].rating)} r="5" fill="#81b64c" stroke="#262421" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded bg-[#3c3a37] px-2 py-1 text-xs text-white" style={{ left: `${(x(hover) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          {serie[hover].mese}: <b>{serie[hover].rating}</b>
        </div>
      )}
    </div>
  );
}
