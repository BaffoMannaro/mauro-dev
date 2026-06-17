import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import PreventivoCliente from '@/components/PreventivoCliente';

export default async function PreventivoPage({
  params,
}: {
  params: { token: string };
}) {
  const [preventivo] = await sql`
    SELECT * FROM preventivi WHERE token = ${params.token}
  `;

  if (!preventivo) notFound();

  return <PreventivoCliente preventivo={preventivo} />;
}

export const metadata = {
  robots: 'noindex, nofollow',
};
