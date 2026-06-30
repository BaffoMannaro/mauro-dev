import sql from '@/lib/db';
import StatisticheDashboard from '@/components/StatisticheDashboard';

export const metadata = { title: 'Statistiche' };

export default async function StatistichePage() {
  const preventivi = await sql`SELECT * FROM preventivi ORDER BY created_at ASC`;
  const abbonamenti = await sql`SELECT * FROM abbonamenti WHERE attivo = true`;
  return <StatisticheDashboard preventivi={preventivi as any} abbonamenti={abbonamenti as any} />;
}