import Link from 'next/link';
import type { Finale } from '@/lib/scacchi/finali';
import type { ProgressoFinale } from '@/lib/scacchi/finali-db';

const OB: Record<Finale['obiettivo'], string> = { matto: 'Matto', promuovi: 'Promuovi', patta: 'Patta' };

export default function FinaliLista({ finali, progressi }: { finali: Finale[]; progressi: Record<string, ProgressoFinale> }) {
  const gruppi = [...new Set(finali.map((f) => f.gruppo))];
  const fatti = finali.filter((f) => progressi[f.id]?.completato).length;
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-3 text-sm text-[#c3c2c1] md:p-5">
      <div className="rounded-lg bg-[#262421] p-4">
        <h1 className="text-xl font-bold text-white">Finali</h1>
        <p className="mt-1">I finali base, contro Stockfish che si difende al meglio. Prima leggi le idee chiave, poi gioca. Se una mossa butta via il risultato te lo dico subito e puoi tornare indietro.</p>
        <p className="mt-2 font-semibold text-white">{fatti} di {finali.length} completati.</p>
      </div>
      {gruppi.map((g) => (
        <div key={g} className="rounded-lg bg-[#262421]">
          <h2 className="border-b border-[#3c3a37] p-3 font-bold text-white">{g}</h2>
          <div className="divide-y divide-[#3c3a37]">
            {finali.filter((f) => f.gruppo === g).map((f) => {
              const p = progressi[f.id];
              return (
                <Link key={f.id} href={`/scacchi/finali/${f.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-3 hover:bg-[#2f2d2a]">
                  <div>
                    <p className="font-semibold text-white">{f.titolo}</p>
                    <p className="text-xs text-[#8b8987]">{OB[f.obiettivo]} · col {f.colore === 'w' ? 'Bianco' : 'Nero'} · {f.mosse} mosse</p>
                  </div>
                  <div className="text-right text-xs">
                    {p?.completato ? <p className="font-bold text-[#81b64c]">Completato · record {p.migliori}</p> : <p className="font-bold text-[#8b8987]">Da fare</p>}
                    {p && <p className="text-[#8b8987]">{p.tentativi} tentativi</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
