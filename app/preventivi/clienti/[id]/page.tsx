import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { ensureClientiSchema } from '@/lib/schema';
import { preparaArchivio } from '@/lib/fattura/server';
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
  await preparaArchivio();

  const [cliente] = await sql`SELECT * FROM clienti WHERE id = ${id}`;
  if (!cliente) notFound();

  const fatture = await sql`
    SELECT id, numero, importo, data, stato, pdf_url, note, created_at
    FROM fatture
    WHERE cliente_id = ${id}
    ORDER BY data DESC NULLS LAST, created_at DESC
  `;

  const preventivi = await sql`
    SELECT id, token, oggetto, totale, stato, tranches_stato,
           lavoro_inizio, lavoro_fine, accettato_at, created_at
    FROM preventivi
    WHERE cliente_id = ${id}
    ORDER BY created_at DESC
  `;

  // Società / dati fiscali con cui il cliente è stato fatturato (dalle fatture XML).
  const societa = await sql`
    SELECT i.id, i.denominazione, i.piva, i.codice_fiscale, i.indirizzo, i.localita,
           i.codice_destinatario, i.pec, to_char(i.dati_al, 'YYYY-MM-DD') AS dati_al,
           count(f.id)::int AS fatture, COALESCE(sum(f.importo), 0)::float8 AS fatturato
    FROM intestatari i LEFT JOIN fatture f ON f.intestatario_id = i.id
    WHERE i.cliente_id = ${id}
    GROUP BY i.id ORDER BY fatturato DESC
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
      fatture={fatture as any}
      societa={societa as any}
    />
  );
}
