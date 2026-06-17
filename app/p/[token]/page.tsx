import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import PreventivoCliente from '@/components/PreventivoCliente';

export default async function PreventivoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [preventivo] = await sql`
    SELECT * FROM preventivi WHERE token = ${token}
  `;

  if (!preventivo) notFound();

  return <PreventivoCliente preventivo={preventivo} />;
}

export const metadata = {
  robots: 'noindex, nofollow',
};