import { cookies } from 'next/headers';
import { isScaduto } from '@/lib/scadenza';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import { ordineFatture } from '@/lib/fattura/server';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';
import PortaleDashboard from '@/components/PortaleDashboard';
import { leggiCanone } from '@/lib/canone';

export const metadata = { title: 'La tua area' };
export const dynamic = 'force-dynamic';

export default async function PortalePage() {
  await ensureFattureXmlSchema(); // portale + colonne delle fatture (anno, per l'ordine)

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
    SELECT id, numero, importo, data, stato, pdf_url, note,
           GREATEST(0, COALESCE(importo, 0) - COALESCE((
             SELECT sum(pf.importo) FROM pagamenti_fattura pf WHERE pf.fattura_id = fatture.id
           ), 0) / 100.0)::float8 AS residuo
    FROM fatture
    WHERE cliente_id = ${session.cid}
    ORDER BY ${ordineFatture()}
  `;

  const haCanone = !!(await leggiCanone(session.cid));

  return (
    <PortaleDashboard
      haCanone={haCanone}
      cliente={cliente as any}
      preventivi={preventivi.map((p) => ({ ...p, scaduto: p.stato === 'inviato' && isScaduto(p) })) as any}
      fatture={fatture as any}
    />
  );
}
