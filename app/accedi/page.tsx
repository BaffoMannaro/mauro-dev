export const metadata = { title: 'Accesso area riservata' };

export default async function AccediPage({
  searchParams,
}: {
  searchParams: Promise<{ errore?: string }>;
}) {
  const { errore } = await searchParams;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="bg-surface border border-edge rounded-2xl p-10 flex flex-col items-center gap-5 w-full max-w-sm text-center">
        <img src="/Logo.svg" alt="MAURO DEV" className="h-10 w-auto logo-adaptive" />
        <div>
          <h1 className="text-text text-2xl font-semibold">Area riservata</h1>
          <p className="text-muted text-sm mt-2">
            Per accedere usa il link personale che ti ho inviato. Il link ti
            porta direttamente alla tua area, senza password.
          </p>
        </div>
        {errore === 'link' && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            Il link non è valido o è scaduto. Scrivimi e te ne mando uno nuovo.
          </p>
        )}
        <p className="text-dim text-xs">
          Non hai il link?{' '}
          <a
            href="mailto:altamura.mauro@gmail.com"
            className="text-accent hover:underline"
          >
            Contattami
          </a>
        </p>
      </div>
    </div>
  );
}
