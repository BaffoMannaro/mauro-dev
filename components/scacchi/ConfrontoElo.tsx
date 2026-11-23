'use client';

import { useState } from 'react';
import { fasciaDi, giudica, MAX_DIFF, type Confronto, type Giudizio, type Metriche } from '@/lib/scacchi/confronto';

const CADENZE: Record<string, string> = { bullet: 'Bullet', blitz: 'Blitz', rapid: 'Rapid', daily: 'Giornaliera' };
const STILE: Record<Giudizio, string> = {
  meglio: 'bg-[#2f3a2a] text-[#a3d160]',
  'in linea': 'bg-[#3c3a37] text-[#c3c2c1]',
  peggio: 'bg-[#3a2a28] text-[#ffa459]',
};

type Riga = { nome: string; v: (m: Metriche) => number | null; alto: boolean; acc?: boolean; unita?: string };
const RIGHE: Riga[] = [
  { nome: 'Accuratezza', v: (m) => m.accuratezza, alto: true, acc: true },
  { nome: 'Imprecisioni', v: (m) => m.imprecisioni100, alto: false, unita: 'ogni 100 mosse' },
  { nome: 'Errori', v: (m) => m.errori100, alto: false, unita: 'ogni 100 mosse' },
  { nome: 'Errori gravi', v: (m) => m.gravi100, alto: false, unita: 'ogni 100 mosse' },
  { nome: 'Occasioni mancate', v: (m) => m.mancate100, alto: false, unita: 'ogni 100 mosse' },
  { nome: 'Mosse brillanti', v: (m) => m.brillanti10, alto: true, unita: 'ogni 10 partite' },
  { nome: 'Mosse ottime', v: (m) => m.ottime10, alto: true, unita: 'ogni 10 partite' },
  { nome: 'Errori in apertura', v: (m) => m.fase100.apertura, alto: false, unita: 'ogni 100 mosse di apertura' },
  { nome: 'Errori nel mediogioco', v: (m) => m.fase100.mediogioco, alto: false, unita: 'ogni 100 mosse di mediogioco' },
  { nome: 'Errori nel finale', v: (m) => m.fase100.finale, alto: false, unita: 'ogni 100 mosse di finale' },
];

export default function ConfrontoElo({ confronto, ratingAttuale }: { confronto: Confronto[]; ratingAttuale: Record<string, number> }) {
  const cadenze = [...new Set(confronto.map((c) => c.cadenza))].sort(
    (a, b) => (confronto.find((c) => c.cadenza === b && c.fascia === 'tutte')?.io.partite ?? 0) - (confronto.find((c) => c.cadenza === a && c.fascia === 'tutte')?.io.partite ?? 0)
  );
  const [cadenza, setCadenza] = useState(cadenze[0] ?? 'rapid');
  const fasce = confronto.filter((c) => c.cadenza === cadenza && c.fascia !== 'tutte' && c.io.partite >= 3);
  const attuale = ratingAttuale[cadenza] ? fasciaDi(ratingAttuale[cadenza]) : null;
  const [fascia, setFascia] = useState<string | null>(null);
  const scelta = fascia ?? (fasce.some((f) => f.fascia === attuale) ? attuale! : 'tutte');
  const c = confronto.find((x) => x.cadenza === cadenza && x.fascia === scelta);

  if (confronto.length === 0) {
    return (
      <div className="rounded-lg bg-[#262421] p-4">
        <h2 className="font-bold text-white">Tu contro i giocatori del tuo Elo</h2>
        <p className="mt-1">Servono partite analizzate: premi &quot;Analizza le ultime 100&quot;.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[#262421] p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-bold text-white">Tu contro i giocatori del tuo Elo</h2>
        {cadenze.map((k) => (
          <button key={k} onClick={() => { setCadenza(k); setFascia(null); }} className={`rounded px-2 py-1 text-xs ${cadenza === k ? 'bg-[#81b64c] text-white' : 'bg-[#3c3a37]'}`}>
            {CADENZE[k] ?? k}
          </button>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1 text-xs">
        <span className="text-[#8b8987]">Tuo rating:</span>
        {[{ fascia: 'tutte' }, ...fasce].map((f) => (
          <button key={f.fascia} onClick={() => setFascia(f.fascia)} className={`rounded px-2 py-0.5 ${scelta === f.fascia ? 'bg-[#484644] text-white' : 'bg-[#3c3a37]'}`}>
            {f.fascia === 'tutte' ? 'Tutte' : f.fascia}{f.fascia === attuale ? ' (oggi)' : ''}
          </button>
        ))}
      </div>
      {c && (
        <>
          <p className="mb-2 text-xs text-[#8b8987]">
            {c.io.partite} partite analizzate: le tue mosse ({c.io.mosse}) contro quelle dei tuoi avversari ({c.avversari.mosse}), tutti entro {MAX_DIFF} punti dal tuo Elo. Stesso motore e stessa formula della tua Game Review.
            {c.io.partite < 15 && ' Campione piccolo: i numeri si stabilizzano con più partite analizzate.'}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-[#8b8987]">
                <tr><th className="text-left font-normal">Metrica</th><th className="font-normal">Tu</th><th className="font-normal">Avversari</th><th className="font-normal">Confronto</th></tr>
              </thead>
              <tbody>
                {RIGHE.map((r) => {
                  const io = r.v(c.io);
                  const avv = r.v(c.avversari);
                  const g = giudica(io, avv, r.alto, r.acc);
                  return (
                    <tr key={r.nome} className="border-t border-[#3c3a37]">
                      <td className="py-1.5 pr-2">
                        <span className="text-white">{r.nome}</span>
                        {r.unita && <span className="block text-[10px] text-[#8b8987]">{r.unita}</span>}
                      </td>
                      <td className="text-center font-bold text-white">{io ?? '–'}</td>
                      <td className="text-center">{avv ?? '–'}</td>
                      <td className="text-center">{g ? <span className={`rounded px-2 py-0.5 text-xs font-semibold ${STILE[g]}`}>{g}</span> : '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
