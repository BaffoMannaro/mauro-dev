import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import sql from '@/lib/db';
import PreventivoCliente from '@/components/PreventivoCliente';
import { isScaduto, scadenzaEffettiva } from '@/lib/scadenza';
import { ensureTardivaSchema, inAttesa } from '@/lib/tardiva';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const rows = await sql`SELECT oggetto, cliente_nome FROM preventivi WHERE token = ${token}`;
  const p = rows[0];
  return {
    title: p ? `${p.oggetto} · ${p.cliente_nome}` : 'Preventivo',
    robots: 'noindex, nofollow',
  };
}

export default async function PreventivoPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ theme?: string; pdf?: string }>;
}) {
  const { token } = await params;
  const q = await searchParams;
  await ensureTardivaSchema();
  const rows = await sql`SELECT * FROM preventivi WHERE token = ${token}`;
  const preventivo = rows[0];

  if (!preventivo) notFound();

  // Dati interni (IP, browser, richiesta tardiva) non arrivano al browser del cliente.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { richiesta_tardiva, accettato_ip, accettato_ua, ...pubblico } = preventivo;

  return (
    <PreventivoCliente
      preventivo={{ ...pubblico, scadenza: scadenzaEffettiva(preventivo) } as any}
      scadutoAlServer={preventivo.stato === 'inviato' && isScaduto(preventivo)}
      richiestaInviata={inAttesa(richiesta_tardiva)}
      // Il PDF (e ?theme=light) si genera sempre con il tema chiaro, deciso dal server:
      // non dipende dallo script del tema nel browser.
      temaChiaro={q.theme === 'light' || q.pdf !== undefined}
      pdf={q.pdf !== undefined}
    />
  );
}
