'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RigaPartita } from '@/lib/scacchi/db';

const CADENZE: Record<string, string> = { bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', daily: 'Giornaliera', bot: 'Bot' };

type MissioneBreve = { titolo: string; giocate: number; totale: number; inRegola: number } | null;

export default function ScacchiHome({ partite, username, missione }: { partite: RigaPartita[]; username: string | null; missione: MissioneBreve }) {
  const router = useRouter();
  const [utente, setUtente] = useState(username ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [pgn, setPgn] = useState('');
  const [filtro, setFiltro] = useState<'tutte' | 'vinta' | 'persa' | 'patta'>('tutte');

  async function importa() {
    setOccupato(true);
    setMsg('Scarico le partite da chess.com…');
    const r = await fetch('/api/scacchi/importa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: utente }),
    });
    const j = await r.json();
    setOccupato(false);
    if (!r.ok) setMsg(j.error ?? 'Errore');
    else {
      setMsg(`Importate ${j.importate} partite (${j.gia_presenti} già presenti) da ${j.mesi.length} mesi.`);
      router.refresh();
    }
  }

  async function incolla() {
    setOccupato(true);
    const r = await fetch('/api/scacchi/partite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pgn }),
    });
    const j = await r.json();
    setOccupato(false);
    if (j.id) router.push(`/scacchi/partita/${j.id}`);
    else setMsg(j.error ?? 'Errore');
  }

  const visibili = partite.filter((p) => filtro === 'tutte' || p.esito_mio === filtro);
  const vinte = partite.filter((p) => p.esito_mio === 'vinta').length;
  const perse = partite.filter((p) => p.esito_mio === 'persa').length;
  const patte = partite.filter((p) => p.esito_mio === 'patta').length;
  const acc = partite.filter((p) => p.accuratezza_mia !== null);
  const accMedia = acc.length ? acc.reduce((s, p) => s + Number(p.accuratezza_mia), 0) / acc.length : null;

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-3 md:p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/scacchi/gioca"
          className="flex flex-col justify-between rounded-lg bg-[#81b64c] p-5 text-white shadow-[0_5px_0_#45753c] transition hover:bg-[#a3d160]"
        >
          <span className="text-3xl">♞</span>
          <span>
            <span className="block text-2xl font-extrabold">Gioca col computer</span>
            <span className="text-sm opacity-90">Da 400 a 3000 Elo, poi Game Review</span>
          </span>
        </Link>

        <div className="rounded-lg bg-[#262421] p-4 text-sm text-[#c3c2c1]">
          <p className="mb-2 font-bold text-white">Partite da chess.com</p>
          <div className="flex gap-2">
            <input
              value={utente}
              onChange={(e) => setUtente(e.target.value)}
              placeholder="username chess.com"
              className="min-w-0 flex-1 rounded bg-[#3c3a37] px-3 py-2 text-white outline-none placeholder:text-[#8b8987] focus:ring-2 focus:ring-[#81b64c]"
            />
            <button onClick={importa} disabled={occupato || !utente.trim()} className="rounded bg-[#81b64c] px-3 font-semibold text-white disabled:opacity-50">
              Importa
            </button>
          </div>
          <p className="mt-2 text-xs text-[#8b8987]">Solo partite pubbliche, via API ufficiale. Al primo import gli ultimi 6 mesi, poi solo le nuove.</p>
        </div>

        <div className="rounded-lg bg-[#262421] p-4 text-sm text-[#c3c2c1]">
          <p className="mb-2 font-bold text-white">Incolla un PGN</p>
          <textarea
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            rows={3}
            placeholder="1. e4 e5 2. Nf3 ..."
            className="w-full rounded bg-[#3c3a37] px-3 py-2 font-mono text-xs text-white outline-none placeholder:text-[#8b8987] focus:ring-2 focus:ring-[#81b64c]"
          />
          <button onClick={incolla} disabled={occupato || !pgn.trim()} className="mt-1 w-full rounded bg-[#3c3a37] py-1.5 font-semibold text-white hover:bg-[#484644] disabled:opacity-50">
            Analizza
          </button>
        </div>
      </div>

      <Link href="/scacchi/coach" className="flex items-center gap-4 rounded-lg border border-[#3c3a37] bg-[#262421] p-4 text-sm text-[#c3c2c1] hover:bg-[#2f2d2a]">
        <span className="text-3xl">♛</span>
        {missione ? (
          <span className="min-w-0 flex-1">
            <span className="block text-xs uppercase tracking-wide text-[#81b64c]">Missione del coach</span>
            <span className="block truncate font-bold text-white">{missione.titolo}</span>
            <span>{missione.giocate} / {missione.totale} partite · {missione.inRegola} nel repertorio</span>
          </span>
        ) : (
          <span className="flex-1">
            <span className="block font-bold text-white">Coach: inizia il programma</span>
            <span>Missioni di partite con regole precise, poi analisi e correzioni.</span>
          </span>
        )}
        <span className="text-[#81b64c]">→</span>
      </Link>

      {msg && <p className="rounded bg-[#262421] px-3 py-2 text-sm text-[#c3c2c1]">{msg}</p>}

      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        <Kpi etichetta="Partite" valore={partite.length} />
        <Kpi etichetta="V / P / N" valore={`${vinte} / ${perse} / ${patte}`} />
        <Kpi etichetta="% vittorie" valore={vinte + perse + patte ? `${Math.round((vinte / (vinte + perse + patte)) * 100)}%` : '–'} />
        <Kpi etichetta="Accuratezza media" valore={accMedia !== null ? accMedia.toFixed(1) : '–'} />
      </div>

      <div className="rounded-lg bg-[#262421]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#3c3a37] p-3">
          <h2 className="mr-auto font-bold text-white">Le mie partite</h2>
          {(['tutte', 'vinta', 'persa', 'patta'] as const).map((f) => (
            <button key={f} onClick={() => setFiltro(f)} className={`rounded px-2 py-1 text-xs ${filtro === f ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37] text-[#c3c2c1]'}`}>
              {f === 'tutte' ? 'Tutte' : f === 'vinta' ? 'Vinte' : f === 'persa' ? 'Perse' : 'Patte'}
            </button>
          ))}
        </div>
        {visibili.length === 0 ? (
          <p className="p-6 text-center text-sm text-[#8b8987]">Nessuna partita. Importa da chess.com, incolla un PGN o gioca col computer.</p>
        ) : (
          <div className="divide-y divide-[#3c3a37]">
            {visibili.map((p) => (
              <Link key={p.id} href={`/scacchi/partita/${p.id}`} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 px-3 py-2 text-sm hover:bg-[#2f2d2a] md:grid-cols-[1.5rem_1fr_14rem_4rem_5rem_6rem]">
                <Esito e={p.esito_mio} />
                <div className="min-w-0">
                  <div className="truncate text-white">
                    <span className={p.colore_mio === 'w' ? 'font-bold' : ''}>{p.bianco}</span>
                    <span className="text-[#8b8987]"> {p.elo_bianco ?? ''}</span>
                    <span className="text-[#8b8987]"> vs </span>
                    <span className={p.colore_mio === 'b' ? 'font-bold' : ''}>{p.nero}</span>
                    <span className="text-[#8b8987]"> {p.elo_nero ?? ''}</span>
                  </div>
                  <div className="truncate text-xs text-[#8b8987] md:hidden">{p.apertura ?? ''}</div>
                </div>
                <span className="hidden truncate text-xs text-[#c3c2c1] md:block" title={p.apertura ?? ''}>{p.eco} {p.apertura ?? ''}</span>
                <span className="hidden text-center text-xs text-[#8b8987] md:block">{CADENZE[p.cadenza ?? ''] ?? p.cadenza ?? ''}</span>
                <span className="text-right text-xs">
                  {p.accuratezza_mia !== null ? <b className="text-white">{Number(p.accuratezza_mia).toFixed(1)}</b> : <span className="text-[#8b8987]">da analizzare</span>}
                  {p.commenti > 0 && <span className="ml-1 text-[#5c8bb0]" title="Commenti di Claude">●</span>}
                </span>
                <span className="hidden text-right text-xs text-[#8b8987] md:block">{p.giocata_il ? new Date(p.giocata_il).toLocaleDateString('it-IT') : ''}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ etichetta, valore }: { etichetta: string; valore: string | number }) {
  return (
    <div className="rounded-lg bg-[#262421] p-3">
      <div className="text-xs text-[#8b8987]">{etichetta}</div>
      <div className="text-xl font-bold text-white">{valore}</div>
    </div>
  );
}

function Esito({ e }: { e: RigaPartita['esito_mio'] }) {
  const s = e === 'vinta' ? ['+', '#81b64c'] : e === 'persa' ? ['−', '#fa412d'] : e === 'patta' ? ['=', '#8b8987'] : ['?', '#3c3a37'];
  return <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-white" style={{ background: s[1] }}>{s[0]}</span>;
}
