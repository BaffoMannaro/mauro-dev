import { notFound } from 'next/navigation';
import ReviewPartita from '@/components/scacchi/ReviewPartita';
import { leggiPartita } from '@/lib/scacchi/db';

export const metadata = { title: 'Game Review · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function PartitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const partita = Number.isInteger(Number(id)) ? await leggiPartita(Number(id)) : null;
  if (!partita) notFound();
  return <ReviewPartita partita={partita} />;
}
