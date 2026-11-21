import ScacchiHome from '@/components/scacchi/ScacchiHome';
import { leggiImpostazioni, listaPartite } from '@/lib/scacchi/db';
import { avanzamento, missioneAttiva } from '@/lib/scacchi/missioni';

export const metadata = { title: 'Scacchi' };
export const dynamic = 'force-dynamic';

export default async function ScacchiPage() {
  const [partite, imp, m] = await Promise.all([listaPartite({ limite: 200 }), leggiImpostazioni(), missioneAttiva()]);
  const av = m ? await avanzamento(m) : null;
  const missione = av ? { titolo: av.missione.titolo, giocate: av.giocate, totale: av.missione.regole.partite, inRegola: av.inRegola } : null;
  return <ScacchiHome partite={partite} username={imp.username} missione={missione} />;
}
