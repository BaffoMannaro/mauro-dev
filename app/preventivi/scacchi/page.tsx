import ScacchiHome from '@/components/scacchi/ScacchiHome';
import { leggiImpostazioni, listaPartite } from '@/lib/scacchi/db';

export const metadata = { title: 'Scacchi' };
export const dynamic = 'force-dynamic';

export default async function ScacchiPage() {
  const [partite, imp] = await Promise.all([listaPartite({ limite: 200 }), leggiImpostazioni()]);
  return <ScacchiHome partite={partite} username={imp.username} />;
}
