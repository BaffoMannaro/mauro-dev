import SottoMenu from '@/components/scacchi/SottoMenu';

// Area Scacchi: tema scuro dedicato, indipendente dal tema del gestionale.
export default function ScacchiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#312e2b] text-[#e8e6e3]">
      <SottoMenu />
      {children}
    </div>
  );
}
