import sql from '@/lib/db';
import StatisticheDashboard from '@/components/StatisticheDashboard';

export default async function StatistichePage() {
  const preventivi = await sql`SELECT * FROM preventivi ORDER BY created_at ASC`;
  return <StatisticheDashboard preventivi={preventivi as any} />;
}
