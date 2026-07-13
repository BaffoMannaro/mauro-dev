import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import { ensurePortaleSchema } from '@/lib/schema';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';
import PortaleDashboard from '@/components/PortaleDashboard';

export const metadata = { title: 'La tua area' };
export const dynamic = 'force-dynamic';

export default async function PortalePage() {
  await ensurePortaleSchema();

  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  const session = token ? await verifyClientToken(token) : null;
  if (!session || session.scope !== 'session') redirect('/accedi');

  const [cliente] = await sql`SELECT * FROM clienti WHERE id = ${session.cid}`;
  if (!cliente) redirect('/accedi');

  const preventivi = await sql`
    SELECT id, token, oggetto, totale, stato, scadenza, tranches_stato,
           lavoro_inizio, lavoro_fine, accettato_at, created_at, meta
    FROM preventivi
    WHERE cliente_id = ${session.cid}
    ORDER BY created_at DESC
  `;
  const fatture = await sql`
    SELECT id, numero, importo, data, stato, pdf_url, note
    FROM fatture
    WHERE cliente_id = ${session.cid}
    ORDER BY data DESC NULLS LAST, created_at DESC
  `;

  return (
    <PortaleDashboard
      cliente={cliente as any}
      preventivi={preventivi as any}
      fatture={fatture as any}
    />
  );
}
