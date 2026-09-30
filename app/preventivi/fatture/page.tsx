import sql from '@/lib/db';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { archivioSelect } from '@/lib/fattura/server';
import FattureDashboard, { type FatturaSalvata } from '@/components/FattureDashboard';

export const metadata = { title: 'Fatture' };

export default async function FatturePage() {
  await ensureFattureXmlSchema();
  const archivio = await sql`${archivioSelect()} WHERE xml IS NOT NULL ORDER BY data DESC, id DESC`;
  return <FattureDashboard archivio={archivio as FatturaSalvata[]} />;
}
