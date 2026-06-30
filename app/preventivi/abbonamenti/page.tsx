import sql from '@/lib/db';
import AbbonamentiDashboard from '@/components/AbbonamentiDashboard';

export const metadata = { title: 'Abbonamenti' };

export default async function AbbonamentiPage() {
  const abbonamenti = await sql`SELECT * FROM abbonamenti ORDER BY created_at DESC`;
  return <AbbonamentiDashboard abbonamenti={abbonamenti as any} />;
}
