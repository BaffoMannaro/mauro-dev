import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import PreventivoCliente from '@/components/PreventivoCliente';

export default async function PreventivoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const rows = await sql`SELECT * FROM preventivi WHERE token = ${token}`;
  const preventivo = rows[0];

  if (!preventivo) notFound();

  return <PreventivoCliente preventivo={preventivo as any} />;
}

export const metadata = {
  robots: 'noindex, nofollow',
};