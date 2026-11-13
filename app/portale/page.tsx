import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';
import { caricaArea } from '@/lib/area-cliente';
import AreaCliente, { type TabArea } from '@/components/area/AreaCliente';

export const metadata = { title: 'La tua area' };
export const dynamic = 'force-dynamic';

const TAB: TabArea[] = ['home', 'lavori', 'ore', 'pagamenti'];

// Area cliente (area.maurodev.it/portale): Home, Lavori, Ore (se c'è un canone), Pagamenti.
export default async function PortalePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE)?.value;
  const session = token ? await verifyClientToken(token) : null;
  if (!session || session.scope !== 'session') redirect('/accedi');

  const oggi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const dati = await caricaArea(session.cid, oggi);
  if (!dati) redirect('/accedi');

  const { tab } = await searchParams;
  return <AreaCliente dati={dati} tab={TAB.includes(tab as TabArea) ? (tab as TabArea) : 'home'} />;
}
