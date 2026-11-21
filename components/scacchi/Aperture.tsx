import Link from 'next/link';
import type { Linea } from '@/lib/scacchi/repertorio';
import type { StatoDrill } from '@/lib/scacchi/missioni';

function stato(s?: StatoDrill) {
  if (!s) return { testo: 'Da studiare', colore: '#8b8987' };
  if (!s.prossimo || new Date(s.prossimo) <= new Date()) return { testo: 'Da ripassare', colore: '#f7c631' };
  const giorni = Math.ceil((new Date(s.prossimo).getTime() - Date.now()) / 86400000);
  return { testo: `Ripasso tra ${giorni} g`, colore: '#81b64c' };
}

export default function Aperture({ linee, drill }: { linee: Linea[]; drill: Record<string, StatoDrill> }) {
  const gruppi = [...new Set(linee.map((l) => l.gruppo))];
  const daRipassare = linee.filter((l) => {
    const s = drill[l.id];
    return !s || !s.prossimo || new Date(s.prossimo) <= new Date();
  }).length;
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-3 md:p-5">
      <div className="rounded-lg bg-[#262421] p-4 text-sm text-[#c3c2c1]">
        <h1 className="text-xl font-bold text-white">Il tuo repertorio</h1>
        <p className="mt-1">
          Bianco: 1.e4 e Italiana. Nero: 1...e5 e Giuoco Piano. Scelto sulle tue 1.825 partite chess.com. Per ogni linea: prima la Lezione, poi il Drill finché non fai un giro senza errori.
        </p>
        <p className="mt-2 font-semibold text-white">{daRipassare} linee da studiare o ripassare oggi.</p>
      </div>
      {gruppi.map((g) => (
        <div key={g} className="rounded-lg bg-[#262421]">
          <h2 className="border-b border-[#3c3a37] p-3 font-bold text-white">{g}</h2>
          <div className="divide-y divide-[#3c3a37]">
            {linee.filter((l) => l.gruppo === g).map((l) => {
              const s = drill[l.id];
              const st = stato(s);
              return (
                <Link key={l.id} href={`/scacchi/aperture/${l.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-3 text-sm hover:bg-[#2f2d2a]">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{l.titolo}</p>
                    <p className="truncate text-xs text-[#8b8987]">{l.mosse.slice(0, 8).map(([m], i) => (i % 2 === 0 ? `${i / 2 + 1}.${m}` : m)).join(' ')}…</p>
                  </div>
                  <div className="text-right text-xs">
                    <p style={{ color: st.colore }} className="font-bold">{st.testo}</p>
                    {s && <p className="text-[#8b8987]">livello {s.livello} · {s.ripassi} giri</p>}
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
