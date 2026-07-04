import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { ensureClientiSchema } from '@/lib/schema';
import ClienteDettaglio from '@/components/ClienteDettaglio';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureClientiSchema();
  const rows = await sql`SELECT nome FROM clienti WHERE id = ${id}`;
  return { title: rows[0]?.nome ? `${rows[0].nome} · Clienti` : 'Cliente' };
}

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureClientiSchema();

  const [cliente] = await sql`SELECT * FROM clienti WHERE id = ${id}`;
  if (!cliente) notFound();

  const preventivi = await sql`
    SELECT id, token, oggetto, totale, stato, tranches_stato,
           lavoro_inizio, lavoro_fine, accettato_at, created_at
    FROM preventivi
    WHERE cliente_id = ${id}
    ORDER BY created_at DESC
  `;

  // Preventivi non ancora associati ad alcun cliente (per la funzione "collega")
  const nonAssociati = await sql`
    SELECT id, oggetto, cliente_nome, cliente_email, totale, stato, created_at
    FROM preventivi
    WHERE cliente_id IS NULL
    ORDER BY created_at DESC
  `;

  // Altri clienti (per la funzione "unisci")
  const altriClienti = await sql`
    SELECT id, nome, azienda, email FROM clienti WHERE id != ${id} ORDER BY nome ASC
  `;

  return (
    <ClienteDettaglio
      cliente={cliente as any}
      preventivi={preventivi as any}
      nonAssociati={nonAssociati as any}
      altriClienti={altriClienti as any}
    />
  );
}
