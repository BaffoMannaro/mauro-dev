import Link from 'next/link';
import sql from '@/lib/db';
import { datiCanone, ensureCanoneSchema } from '@/lib/canone';
import { fmtMinuti, nomeMese } from '@/lib/canone-calcolo';
import { euro, euroCent } from '@/lib/formato';

export const metadata = { title: 'Canoni' };
export const dynamic = 'force-dynamic';

// Clienti con canone ore: ore del mese, cose da fare (stime, lavori in attesa), link alla scheda e all'anteprima.
export default async function CanoniPage() {
  await ensureCanoneSchema();
  const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const clienti = await sql`
    SELECT c.id, c.nome, c.azienda FROM canoni k JOIN clienti c ON c.id = k.cliente_id ORDER BY c.nome
  `;
  const righe = await Promise.all(
    clienti.map(async (c) => ({ cliente: c, dati: await datiCanone(c.id, oggi) }))
  );
  const incassoMese = righe.reduce((s, r) => s + (r.dati.corrente ? r.dati.canone!.prezzo_mese + r.dati.corrente.costo_extra : 0), 0);
  const daStimare = righe.reduce((s, r) => s + r.dati.richieste.filter((x) => x.stato === 'nuova').length, 0);
  const oreUsate = righe.reduce((s, r) => s + (r.dati.corrente?.usate ?? 0), 0);

  return (
    <div className="min-h-screen text-text">
      <header className="testata">
        <div>
          <h1 className="titolo-pagina">Canoni</h1>
          <p className="text-dim text-xs mt-0.5">Clienti con un monte ore mensile · {nomeMese(oggi.slice(0, 7))}</p>
        </div>
      </header>

      <div className="corpo max-w-5xl">
        <div className="kpi-griglia sm:grid-cols-3">
          <div className="kpi">
            <p className="kpi-etichetta">CANONI + EXTRA DEL MESE</p>
            <p className="kpi-valore">{euro(incassoMese)}</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">ORE USATE NEL MESE</p>
            <p className="kpi-valore">{fmtMinuti(oreUsate)}</p>
          </div>
          <div className="kpi">
            <p className="kpi-etichetta">RICHIESTE DA STIMARE</p>
            <p className={`kpi-valore ${daStimare ? 'text-amber-400' : ''}`}>{daStimare}</p>
          </div>
        </div>

        {righe.length === 0 ? (
          <div className="text-center py-16 text-dim">
            <p className="font-medium">Nessun canone attivo</p>
            <p className="text-sm mt-1">Si attiva dalla scheda di un cliente, nel riquadro &quot;Canone ore&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {righe.map(({ cliente, dati }) => {
              const m = dati.corrente;
              const disp = m ? m.incluse + m.riportate : 0;
              const nuove = dati.richieste.filter((x) => x.stato === 'nuova').length;
              const attesa = dati.lavori.filter((l) => l.stato === 'attesa_cliente').length;
              const inCorso = dati.lavori.filter((l) => l.stato === 'in_corso').length;
              return (
                <section key={cliente.id} className="scheda flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{cliente.nome}</p>
                      {cliente.azienda && cliente.azienda !== cliente.nome && <p className="text-muted text-sm truncate">{cliente.azienda}</p>}
                      <p className="text-dim text-xs mt-0.5">
                        {dati.canone!.ore_mese} h a {euroCent(dati.canone!.prezzo_mese)} al mese
                      </p>
                    </div>
                    {nuove > 0 && <span className="text-[11px] bg-accent text-on-accent rounded-full px-2 py-0.5 shrink-0">{nuove} da stimare</span>}
                  </div>
                  {m && (
                    <>
                      <div className="h-2 rounded-full bg-surface2 overflow-hidden flex">
                        <div className="bg-sky-500" style={{ width: `${(Math.min(m.usate, disp) / Math.max(disp, m.usate, 1)) * 100}%` }} />
                        {m.extra > 0 && <div className="bg-amber-500" style={{ width: `${(m.extra / Math.max(disp, m.usate, 1)) * 100}%` }} />}
                      </div>
                      <dl className="grid grid-cols-4 gap-2 text-sm">
                        <div><dt className="text-dim text-[11px]">Rimaste</dt><dd className="font-semibold tabular-nums">{fmtMinuti(m.rimaste)}</dd></div>
                        <div><dt className="text-dim text-[11px]">Usate</dt><dd className="tabular-nums">{fmtMinuti(m.usate)}</dd></div>
                        <div><dt className="text-dim text-[11px]">Riportate</dt><dd className="tabular-nums">{fmtMinuti(m.riportate)}</dd></div>
                        <div><dt className="text-dim text-[11px]">Extra</dt><dd className={`tabular-nums ${m.extra ? 'text-amber-400' : ''}`}>{m.extra ? fmtMinuti(m.extra) : '-'}</dd></div>
                      </dl>
                    </>
                  )}
                  <p className="text-xs text-dim">
                    {[inCorso && `${inCorso} lavori in corso`, attesa && `${attesa} in attesa del cliente`].filter(Boolean).join(' · ') || 'Nessun lavoro aperto'}
                  </p>
                  <div className="flex gap-2 mt-auto">
                    <Link href={`/clienti/${cliente.id}`} className="flex-1 text-center text-xs px-3 py-2 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors">Gestisci</Link>
                    <Link href={`/clienti/${cliente.id}/anteprima`} className="flex-1 text-center text-xs px-3 py-2 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors">Vedi come il cliente</Link>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
