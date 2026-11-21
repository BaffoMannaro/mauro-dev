import FinaliLista from '@/components/scacchi/FinaliLista';
import { FINALI } from '@/lib/scacchi/finali';
import { progressiFinali } from '@/lib/scacchi/finali-db';

export const metadata = { title: 'Finali · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function FinaliPage() {
  return <FinaliLista finali={FINALI} progressi={await progressiFinali()} />;
}
