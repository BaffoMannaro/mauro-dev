import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { datiCanone } from '@/lib/canone';
import CanonePagina from '@/components/CanonePagina';

export const metadata = { title: 'Anteprima cliente' };
export const dynamic = 'force-dynamic';

// "Vedi come il cliente": la pagina /canone del cliente, in sola lettura, dal gestionale.
export default async function AnteprimaCanone({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const dati = await datiCanone(Number(id), oggi);
  if (!dati.canone) notFound();
  const [cliente] = await sql`SELECT nome, azienda FROM clienti WHERE id = ${id}`;
  if (!cliente) notFound();

  return (
    <CanonePagina
      cliente={{ nome: cliente.nome, azienda: cliente.azienda }}
      oggi={oggi}
      {...dati}
      canone={dati.canone}
      anteprima={{ indietro: `/clienti/${id}` }}
    />
  );
}
