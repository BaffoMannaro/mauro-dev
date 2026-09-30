import { leggiAzioni, raccogliOsservazioni } from '@/lib/listino-db';
import ListinoDashboard from '@/components/ListinoDashboard';

export const metadata = { title: 'Listino' };

export default async function ListinoPage() {
  const osservazioni = await raccogliOsservazioni();
  const azioni = await leggiAzioni();
  return <ListinoDashboard osservazioni={osservazioni} azioni={azioni} />;
}
