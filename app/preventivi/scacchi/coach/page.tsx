import Coach from '@/components/scacchi/Coach';
import { avanzamento, listaMissioni, missioneAttiva, statoDrill } from '@/lib/scacchi/missioni';
import { PROGRAMMA } from '@/lib/scacchi/coach';
import { leggiImpostazioni } from '@/lib/scacchi/db';
import { bilancioMissione } from '@/lib/scacchi/bilancio';
import { progressiFinali } from '@/lib/scacchi/finali-db';

export const metadata = { title: 'Coach · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function CoachPage() {
  const m = await missioneAttiva();
  const [av, storico, drill, imp, finali] = await Promise.all([m ? avanzamento(m) : null, listaMissioni(), statoDrill(), leggiImpostazioni(), progressiFinali()]);
  const fatti = Object.values(finali).filter((p) => p.completato).map((p) => p.finale_id);
  // Bilancio della missione attiva, oppure dell'ultima chiusa (con la proposta della successiva).
  const riferimento = m ?? storico.find((x) => x.stato === 'completata') ?? storico.find((x) => x.stato !== 'attiva') ?? null;
  const bilancio = riferimento ? await bilancioMissione(riferimento, fatti) : null;
  return <Coach av={av} programma={PROGRAMMA} storico={storico} drill={drill} username={imp.username} bilancio={bilancio} />;
}
