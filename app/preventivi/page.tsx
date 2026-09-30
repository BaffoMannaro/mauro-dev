import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import AdminDashboard from '@/components/AdminDashboard';
import { aperturePerPreventivo } from '@/lib/visite';

export const metadata = { title: 'Preventivi' };

export default async function PreventiviPage() {
  const session = await auth();
  const preventivi = await sql`SELECT * FROM preventivi ORDER BY created_at DESC`;
  const aperture = await aperturePerPreventivo();
  return <AdminDashboard preventivi={preventivi as any} session={session} aperture={aperture} />;
}
