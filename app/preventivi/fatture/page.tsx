import sql from '@/lib/db';
import { archivioSelect, preparaArchivio, preventiviCollegabili } from '@/lib/fattura/server';
import FattureDashboard, { type FatturaSalvata } from '@/components/FattureDashboard';

export const metadata = { title: 'Fatture' };

export default async function FatturePage() {
  await preparaArchivio();
  const archivio = await sql`${archivioSelect()} WHERE xml IS NOT NULL ORDER BY data DESC, id DESC`;
  const preventivi = await preventiviCollegabili();
  return <FattureDashboard archivio={archivio as FatturaSalvata[]} preventivi={preventivi} />;
}
