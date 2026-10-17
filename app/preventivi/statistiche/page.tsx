import sql from '@/lib/db';
import { preparaArchivio } from '@/lib/fattura/server';
import type { FatturaIncasso } from '@/lib/incassi';
import StatisticheDashboard from '@/components/StatisticheDashboard';

export const metadata = { title: 'Statistiche' };

export default async function StatistichePage() {
  const preventivi = await sql`SELECT * FROM preventivi ORDER BY created_at ASC`;
  const abbonamenti = await sql`SELECT * FROM abbonamenti WHERE attivo = true`;
  await preparaArchivio();
  const fatture = await sql`
    SELECT preventivo_id, importo::float8 AS importo, to_char(data, 'YYYY-MM-DD') AS data, stato FROM fatture
  `;
  return <StatisticheDashboard preventivi={preventivi as any} abbonamenti={abbonamenti as any} fatture={fatture as FatturaIncasso[]} />;
}