import { notFound } from 'next/navigation';
import FinaleGioco from '@/components/scacchi/FinaleGioco';
import { trovaFinale } from '@/lib/scacchi/finali';
import { progressiFinali } from '@/lib/scacchi/finali-db';

export const metadata = { title: 'Finale · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function FinalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const finale = trovaFinale(id);
  if (!finale) notFound();
  return <FinaleGioco finale={finale} progresso={(await progressiFinali())[id] ?? null} />;
}
