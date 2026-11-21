import SottoMenu from '@/components/scacchi/SottoMenu';
import { TemaScacchi } from '@/components/scacchi/TemaScacchi';
import { leggiImpostazioni } from '@/lib/scacchi/db';

// Area Scacchi: tema scuro dedicato, indipendente dal tema del gestionale.
export default async function ScacchiLayout({ children }: { children: React.ReactNode }) {
  const { pezzi } = await leggiImpostazioni();
  return (
    <TemaScacchi pezzi={pezzi}>
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#312e2b] text-[#e8e6e3]">
        <SottoMenu />
        {children}
      </div>
    </TemaScacchi>
  );
}
