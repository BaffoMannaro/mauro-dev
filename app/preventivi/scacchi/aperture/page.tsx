import Aperture from '@/components/scacchi/Aperture';
import { REPERTORIO } from '@/lib/scacchi/repertorio';
import { statoDrill } from '@/lib/scacchi/missioni';

export const metadata = { title: 'Repertorio · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function AperturePage() {
  return <Aperture linee={REPERTORIO} drill={await statoDrill()} />;
}
