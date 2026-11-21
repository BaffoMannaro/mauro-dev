import Coach from '@/components/scacchi/Coach';
import { avanzamento, listaMissioni, missioneAttiva, statoDrill } from '@/lib/scacchi/missioni';
import { PROGRAMMA } from '@/lib/scacchi/coach';
import { leggiImpostazioni } from '@/lib/scacchi/db';

export const metadata = { title: 'Coach · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function CoachPage() {
  const m = await missioneAttiva();
  const [av, storico, drill, imp] = await Promise.all([m ? avanzamento(m) : null, listaMissioni(), statoDrill(), leggiImpostazioni()]);
  return <Coach av={av} programma={PROGRAMMA} storico={storico} drill={drill} username={imp.username} />;
}
