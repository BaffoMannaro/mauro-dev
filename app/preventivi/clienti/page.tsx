import sql from '@/lib/db';
import { ensureClientiSchema } from '@/lib/schema';
import ClientiDashboard from '@/components/ClientiDashboard';

export const metadata = { title: 'Clienti' };

export default async function ClientiPage() {
  await ensureClientiSchema();

  const clienti = await sql`SELECT * FROM clienti ORDER BY created_at DESC`;
  const preventivi = await sql`
    SELECT id, cliente_id, cliente_nome, cliente_azienda, cliente_email,
           totale, stato, tranches_stato, accettato_at, created_at, meta
    FROM preventivi
    ORDER BY created_at DESC
  `;
  const [pref] = await sql`SELECT valore FROM impostazioni WHERE chiave = 'clienti_sort'`;

  return (
    <ClientiDashboard
      clienti={clienti as any}
      preventivi={preventivi as any}
      initialSort={(pref?.valore as any) ?? null}
    />
  );
}
