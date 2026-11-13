import sql from '@/lib/db';
import { isScaduto } from '@/lib/scadenza';
import { ordineFatture } from '@/lib/fattura/server';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { datiCanone } from '@/lib/canone';

// Date e timestamp arrivano come Date o come stringa: qui diventano sempre 'AAAA-MM-GG'.
const iso = (v: unknown) => (v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

export type DatiArea = NonNullable<Awaited<ReturnType<typeof caricaArea>>>;

/** Tutto quello che serve all'area cliente (portale + canone ore), in un colpo. */
export async function caricaArea(clienteId: number, oggi: string) {
  await ensureFattureXmlSchema(); // portale + colonne delle fatture (anno, per l'ordine)

  const [cliente] = await sql`SELECT id, nome, azienda, email, telefono, piva FROM clienti WHERE id = ${clienteId}`;
  if (!cliente) return null;

  const preventivi = await sql`
    SELECT id, token, oggetto, totale, stato, scadenza, tranches_stato,
           lavoro_inizio, lavoro_fine, accettato_at, created_at, meta
    FROM preventivi
    WHERE cliente_id = ${clienteId}
    ORDER BY created_at DESC
  `;
  const fatture = await sql`
    SELECT id, numero, importo, data, stato, pdf_url, note,
           GREATEST(0, COALESCE(importo, 0) - COALESCE((
             SELECT sum(pf.importo) FROM pagamenti_fattura pf WHERE pf.fattura_id = fatture.id
           ), 0) / 100.0)::float8 AS residuo
    FROM fatture
    WHERE cliente_id = ${clienteId}
    ORDER BY ${ordineFatture()}
  `;
  const canone = await datiCanone(clienteId, oggi);

  return {
    oggi,
    cliente: cliente as { id: number; nome: string; azienda: string | null; email: string | null; telefono: string | null; piva: string | null },
    preventivi: preventivi.map((p) => ({
      id: p.id as number,
      token: p.token as string,
      oggetto: p.oggetto as string,
      totale: Number(p.totale) || 0,
      stato: p.stato as string,
      tranches_stato: p.tranches_stato as { percentuale: number; pagato: boolean }[] | null,
      lavoro_inizio: iso(p.lavoro_inizio),
      lavoro_fine: iso(p.lavoro_fine),
      accettato_at: iso(p.accettato_at),
      scaduto: p.stato === 'inviato' && isScaduto(p),
    })),
    fatture: fatture.map((f) => ({
      id: f.id as number,
      numero: f.numero as string | null,
      importo: f.importo == null ? null : Number(f.importo),
      data: iso(f.data),
      stato: f.stato as string,
      residuo: f.residuo == null ? null : Number(f.residuo),
      pdf_url: f.pdf_url as string | null,
    })),
    canone: canone.canone ? { ...canone, canone: canone.canone } : null,
  };
}
