import { notFound } from 'next/navigation';
import { caricaArea } from '@/lib/area-cliente';
import AreaCliente from '@/components/area/AreaCliente';

export const metadata = { title: 'Anteprima cliente' };
export const dynamic = 'force-dynamic';

// "Vedi come il cliente": l'area cliente in sola lettura, dal gestionale.
export default async function AnteprimaArea({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const dati = await caricaArea(Number(id), oggi);
  if (!dati) notFound();
  return <AreaCliente dati={dati} anteprima={{ indietro: `/clienti/${id}` }} />;
}
