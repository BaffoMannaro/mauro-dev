import StatisticheScacchi from '@/components/scacchi/StatisticheScacchi';
import { statistiche } from '@/lib/scacchi/statistiche';
import { leggiImpostazioni } from '@/lib/scacchi/db';

export const metadata = { title: 'Statistiche · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function StatistichePage() {
  const [s, imp] = await Promise.all([statistiche(), leggiImpostazioni()]);
  return <StatisticheScacchi s={s} username={imp.username} />;
}
