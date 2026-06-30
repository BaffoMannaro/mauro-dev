import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import sql from '@/lib/db';
import PreventivoCliente from '@/components/PreventivoCliente';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const rows = await sql`SELECT oggetto, cliente_nome FROM preventivi WHERE token = ${token}`;
  const p = rows[0];
  return {
    title: p ? `${p.oggetto} · ${p.cliente_nome}` : 'Preventivo',
    robots: 'noindex, nofollow',
  };
}

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