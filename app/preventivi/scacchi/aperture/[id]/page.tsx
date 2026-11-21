import { notFound } from 'next/navigation';
import Lezione from '@/components/scacchi/Lezione';
import { trovaLinea } from '@/lib/scacchi/repertorio';
import { statoDrill } from '@/lib/scacchi/missioni';

export const metadata = { title: 'Lezione · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function LezionePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const linea = trovaLinea(id);
  if (!linea) notFound();
  const s = (await statoDrill())[id];
  return <Lezione linea={linea} livello={s?.livello ?? 0} />;
}
