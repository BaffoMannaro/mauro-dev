import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';
import { datiCanone } from '@/lib/canone';
import CanonePagina from '@/components/CanonePagina';

export const metadata = { title: 'Ore e lavori' };
export const dynamic = 'force-dynamic';

// Pagina dedicata ai clienti con canone ore (area.maurodev.it/canone).
export default async function CanonePage() {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  const session = token ? await verifyClientToken(token) : null;
  if (!session || session.scope !== 'session') redirect('/accedi');

  const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const dati = await datiCanone(session.cid, oggi);
  if (!dati.canone) redirect('/portale');

  const [cliente] = await sql`SELECT id, nome, azienda FROM clienti WHERE id = ${session.cid}`;
  if (!cliente) redirect('/accedi');

  return (
    <CanonePagina
      cliente={{ nome: cliente.nome, azienda: cliente.azienda }}
      oggi={oggi}
      {...dati}
      canone={dati.canone}
    />
  );
}
