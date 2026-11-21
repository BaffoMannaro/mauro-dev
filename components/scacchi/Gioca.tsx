'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import Scacchiera from './Scacchiera';
import { ListaMosse, Navigazione } from './Pannelli';
import { BOT, Motore } from '@/lib/scacchi/motore';
import { apertura } from '@/lib/scacchi/partita';
import { suonoMossa } from './suoni';

type Stato = 'scelta' | 'gioco' | 'fine';

export default function Gioca() {
  const router = useRouter();
  const [elo, setElo] = useState(1200);
  const [scelta, setScelta] = useState<'w' | 'b' | 'r'>('w');
  const [colore, setColore] = useState<'w' | 'b'>('w');
  const [stato, setStato] = useState<Stato>('scelta');
  const [mosse, setMosse] = useState<string[]>([]); // uci
  const [vista, setVista] = useState<number | null>(null); // ply mostrato se si naviga indietro
  const [esito, setEsito] = useState<{ risultato: string; motivo: string } | null>(null);
  const [pensa, setPensa] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const motore = useRef<Motore | null>(null);
  const partitaId = useRef(0); // cambia a ogni nuova partita o abbandono: scarta le risposte del bot in ritardo

  useEffect(() => () => motore.current?.chiudi(), []);

  const gioco = useMemo(() => {
    const c = new Chess();
    for (const u of mosse) c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    return c;
  }, [mosse]);
  const storia = gioco.history({ verbose: true });
  const ap = useMemo(() => {
    let a: string | null = null;
    for (const m of storia) {
      const x = apertura(m.after);
      if (x) a = `${x.eco} ${x.nome}`;
    }
    return a;
  }, [storia]);

  function controllaFine(c: Chess) {
    if (!c.isGameOver()) return false;
    let risultato = '1/2-1/2';
    let motivo = 'Patta';
    if (c.isCheckmate()) {
      risultato = c.turn() === 'w' ? '0-1' : '1-0';
      motivo = 'Scacco matto';
    } else if (c.isStalemate()) motivo = 'Stallo';
    else if (c.isThreefoldRepetition()) motivo = 'Triplice ripetizione';
    else if (c.isInsufficientMaterial()) motivo = 'Materiale insufficiente';
    else motivo = 'Regola delle 50 mosse';
    setEsito({ risultato, motivo });
    setStato('fine');
    return true;
  }

  async function turnoBot(lista: string[]) {
    const c = new Chess();
    for (const u of lista) c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    if (controllaFine(c)) return;
    const mia = partitaId.current;
    setPensa(true);
    const inizio = Date.now();
    const m = await (motore.current ??= new Motore()).mossaBot(c.fen(), elo);
    // Un minimo di attesa per non far sembrare il bot istantaneo.
    await new Promise((r) => setTimeout(r, Math.max(0, 350 - (Date.now() - inizio))));
    if (mia !== partitaId.current) return;
    setPensa(false);
    if (!m) return;
    const san = c.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m[4] }).san;
    suonoMossa(san);
    const nuove = [...lista, m];
    setMosse(nuove);
    controllaFine(c);
  }

  function inizia() {
    const col = scelta === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : scelta;
    partitaId.current++;
    setPensa(false);
    setColore(col);
    setMosse([]);
    setVista(null);
    setEsito(null);
    setStato('gioco');
    if (col === 'b') void turnoBot([]);
  }

  function onMossa(uci: string) {
    if (stato !== 'gioco' || pensa || vista !== null) return false;
    const c = new Chess(gioco.fen());
    let san: string;
    try {
      san = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
    } catch {
      return false;
    }
    suonoMossa(san);
    const nuove = [...mosse, uci];
    setMosse(nuove);
    if (!controllaFine(c)) void turnoBot(nuove);
    return true;
  }

  function abbandona() {
    setEsito({ risultato: colore === 'w' ? '0-1' : '1-0', motivo: 'Abbandono' });
    setStato('fine');
    partitaId.current++;
    setPensa(false);
    motore.current?.stop();
  }

  async function salvaERivedi() {
    setSalvando(true);
    const nomeBot = `Bot ${elo}`;
    const c = new Chess();
    for (const u of mosse) c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
    const oggi = new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    c.setHeader('Event', `Partita contro ${nomeBot}`);
    c.setHeader('Date', oggi);
    c.setHeader('White', colore === 'w' ? 'Mauro' : nomeBot);
    c.setHeader('Black', colore === 'b' ? 'Mauro' : nomeBot);
    c.setHeader(colore === 'w' ? 'BlackElo' : 'WhiteElo', String(elo));
    c.setHeader('Result', esito?.risultato ?? '*');
    c.setHeader('Termination', esito?.motivo ?? '');
    const r = await fetch('/api/scacchi/partite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pgn: c.pgn(), fonte: 'bot', coloreMio: colore }),
    });
    const j = await r.json();
    setSalvando(false);
    if (j.id) router.push(`/scacchi/partita/${j.id}`);
  }

  const plyMostrato = vista ?? mosse.length;
  const fenMostrata = plyMostrato === 0 ? new Chess().fen() : storia[plyMostrato - 1]?.after ?? gioco.fen();
  const ultima = plyMostrato > 0 ? mosse[plyMostrato - 1] : null;
  const bot = BOT.find((b) => b.elo === elo);

  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-3 md:p-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex flex-col gap-2">
        <Riga nome={stato === 'scelta' ? 'Avversario' : `${bot?.nome ?? 'Bot'} (${elo})`} nota={pensa ? 'sta pensando…' : null} />
        <Scacchiera
          fen={fenMostrata}
          orientamento={colore === 'b' && stato !== 'scelta' ? 'black' : 'white'}
          ultima={ultima}
          onMossa={stato === 'gioco' ? onMossa : undefined}
          muove={stato === 'gioco' && !pensa && vista === null ? colore : null}
          id="gioca"
        />
        <Riga nome="Mauro" />
      </div>

      <aside className="flex flex-col gap-3 rounded-lg bg-[#262421] p-3 text-sm text-[#c3c2c1]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Gioca contro il computer</h1>
          <Link href="/scacchi" className="hover:text-white">← Partite</Link>
        </div>

        {stato === 'scelta' ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {BOT.map((b) => (
                <button
                  key={b.elo}
                  onClick={() => setElo(b.elo)}
                  className={`rounded p-2 text-center ${elo === b.elo ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37] hover:bg-[#484644]'}`}
                >
                  <div className="text-base font-bold">{b.elo}</div>
                  <div className="text-[11px] leading-tight">{b.nome}</div>
                </button>
              ))}
            </div>
            <div>
              <p className="mb-1 font-semibold text-white">Gioco con</p>
              <div className="flex gap-2">
                {([['w', 'Bianco'], ['r', 'Casuale'], ['b', 'Nero']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setScelta(k)} className={`flex-1 rounded py-2 ${scelta === k ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37]'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={inizia} className="rounded-lg bg-[#81b64c] py-3 text-lg font-bold text-white shadow-[0_4px_0_#45753c] hover:bg-[#a3d160]">
              Gioca
            </button>
            <p className="text-[11px] text-[#8b8987]">
              Sotto 1320 Elo il motore non ha un limite ufficiale: i livelli bassi usano profondità ridotta e qualche mossa imprecisa voluta.
            </p>
          </>
        ) : (
          <>
            {ap && <p className="rounded bg-[#3c3a37] px-2 py-1 text-xs">{ap}</p>}
            <ListaMosse
              mosse={storia.map((m, i) => ({ ply: i + 1, san: m.san }))}
              corrente={plyMostrato}
              onSalta={(p) => setVista(p >= mosse.length ? null : p)}
            />
            <Navigazione corrente={plyMostrato} totale={mosse.length} onSalta={(p) => setVista(p >= mosse.length ? null : Math.max(0, p))} />
            {stato === 'gioco' ? (
              <div className="flex gap-2">
                <button onClick={abbandona} className="flex-1 rounded bg-[#3c3a37] py-2 hover:bg-[#484644]">Abbandona</button>
              </div>
            ) : (
              <div className="rounded bg-[#3c3a37] p-3 text-center">
                <p className="text-lg font-bold text-white">
                  {esito?.risultato === '1/2-1/2' ? 'Patta' : (esito?.risultato === '1-0') === (colore === 'w') ? 'Hai vinto!' : 'Hai perso'}
                </p>
                <p className="mb-3">{esito?.motivo}</p>
                <div className="flex gap-2">
                  <button onClick={salvaERivedi} disabled={salvando || mosse.length < 2} className="flex-1 rounded bg-[#81b64c] py-2 font-bold text-white disabled:opacity-50">
                    {salvando ? 'Salvo…' : 'Game Review'}
                  </button>
                  <button onClick={() => setStato('scelta')} className="flex-1 rounded bg-[#262421] py-2">Nuova partita</button>
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function Riga({ nome, nota }: { nome: string; nota?: string | null }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex h-7 w-7 items-center justify-center rounded bg-[#3c3a37] text-white">♟</span>
      <span className="font-semibold text-white">{nome}</span>
      {nota && <span className="text-xs text-[#8b8987]">{nota}</span>}
    </div>
  );
}
