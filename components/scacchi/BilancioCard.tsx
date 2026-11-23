import Link from 'next/link';
import type { Bilancio } from '@/lib/scacchi/bilancio';
import { CONSIGLI_TIPO } from '@/lib/scacchi/tipi-errore';

const FASI = { apertura: 'Apertura', mediogioco: 'Mediogioco', finale: 'Finale' } as const;

export default function BilancioCard({ b, inCorso }: { b: Bilancio; inCorso: boolean }) {
  const max = Math.max(1, ...b.perTipo.map((t) => t.n));
  const numero = (ply: number) => `${Math.ceil(ply / 2)}${ply % 2 ? '.' : '...'}`;
  return (
    <div className="rounded-lg bg-[#262421] p-4">
      <h2 className="font-bold text-white">{inCorso ? 'Bilancio finora' : 'Bilancio della missione precedente'}</h2>
      <p className="mb-3 text-xs text-[#8b8987]">
        {b.analizzate} partite analizzate su {b.partite}. Errori, errori gravi e occasioni mancate: {b.errori}.
        {b.analizzate < b.partite && ' Analizza le altre per un bilancio completo.'}
      </p>
      {b.errori === 0 ? (
        <p>Ancora niente da segnalare.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8b8987]">Che tipo di errori</p>
            {b.perTipo.map((t, i) => (
              <div key={t.tipo} className="mb-2">
                <div className="flex justify-between text-xs"><span className="text-white">{t.nome}</span><span>{t.n}</span></div>
                <div className="mt-0.5 h-2 rounded bg-[#3c3a37]"><div className="h-2 rounded bg-[#ffa459]" style={{ width: `${(t.n / max) * 100}%` }} /></div>
                <p className="mt-0.5 text-[11px]">
                  {t.esempi.map((e, k) => (
                    <Link key={k} href={`/scacchi/partita/${e.partita_id}`} className="mr-2 underline hover:text-white">
                      {numero(e.ply)} {e.san}{e.migliore ? ` (meglio ${e.migliore})` : ''}
                    </Link>
                  ))}
                </p>
                {i === 0 && <p className="mt-1 rounded bg-[#3c3a37] px-2 py-1 text-xs text-white">{CONSIGLI_TIPO[t.tipo]}</p>}
              </div>
            ))}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8b8987]">Per fase</p>
            {(['apertura', 'mediogioco', 'finale'] as const).map((f) => (
              <div key={f} className="flex justify-between border-t border-[#3c3a37] py-1"><span className="text-white">{FASI[f]}</span><span>{b.perFase[f]}</span></div>
            ))}
            <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-[#8b8987]">Partite vinte buttate</p>
            {b.nonConvertite.length === 0 ? (
              <p className="text-xs">Nessuna.</p>
            ) : (
              b.nonConvertite.map((n) => (
                <Link key={n.partita_id} href={`/scacchi/partita/${n.partita_id}`} className="block text-xs underline hover:text-white">
                  Partita {n.partita_id}: eri al {Math.round(n.massimo * 100)}%, finita {n.esito ?? '?'} ({n.fine})
                </Link>
              ))
            )}
            {b.zeitnot > 0 && <p className="mt-2 text-xs">Errori in zeitnot: <b className="text-white">{b.zeitnot}</b></p>}
            {b.deviazioni.length > 0 && (
              <>
                <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-[#8b8987]">Uscite dal repertorio</p>
                {b.deviazioni.map((d) => (
                  <p key={d.partita_id} className="text-xs">{d.mossa} invece di <b className="text-[#81b64c]">{d.attesa}</b> (partita {d.partita_id})</p>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
