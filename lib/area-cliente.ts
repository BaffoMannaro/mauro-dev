import sql from '@/lib/db';
import { isScaduto } from '@/lib/scadenza';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { datiCanone } from '@/lib/canone';
import { parseFattura } from '@/lib/fattura/parse';

// Date e timestamp arrivano come Date o come stringa: qui diventano sempre 'AAAA-MM-GG'.
const iso = (v: unknown) => (v == null ? null : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));

export type DatiArea = NonNullable<Awaited<ReturnType<typeof caricaArea>>>;

/** Tutto quello che serve all'area cliente (portale + canone ore), in un colpo. */
export async function caricaArea(clienteId: number, oggi: string) {
  await ensureFattureXmlSchema(); // portale + colonne delle fatture (anno, per l'ordine)

  const [cliente] = await sql`SELECT id, nome, azienda, email, telefono, piva FROM clienti WHERE id = ${clienteId}`;
  if (!cliente) return null;

  const piva = normPiva(cliente.piva);
  const fattureDelCliente = condizioneFatture(clienteId, piva);

  const preventivi = await sql`
    SELECT id, token, oggetto, totale, stato, scadenza, tranches_stato,
           lavoro_inizio, lavoro_fine, accettato_at, created_at, meta
    FROM preventivi p
    WHERE p.cliente_id = ${clienteId}
       OR p.id IN (SELECT f.preventivo_id FROM fatture f WHERE f.preventivo_id IS NOT NULL AND ${fattureDelCliente})
       OR (${piva} <> '' AND upper(regexp_replace(regexp_replace(COALESCE(p.meta->'cliente'->>'piva', ''), '[^A-Za-z0-9]', '', 'g'), '^IT', '', 'i')) = ${piva})
    ORDER BY created_at DESC
  `;
  const fatture = await sql`
    SELECT f.id, f.numero, f.importo, f.data, f.stato, f.pdf_url, f.preventivo_id, f.xml IS NOT NULL AS ha_xml, f.xml,
           GREATEST(0, COALESCE(f.importo, 0) - COALESCE((
             SELECT sum(pf.importo) FROM pagamenti_fattura pf WHERE pf.fattura_id = f.id
           ), 0) / 100.0)::float8 AS residuo
    FROM fatture f
    WHERE ${fattureDelCliente}
    ORDER BY COALESCE(f.anno, extract(year FROM f.data)::int) DESC NULLS LAST,
             substring(f.numero FROM '[0-9]+')::int DESC NULLS LAST, f.id DESC
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
      preventivo_id: (f.preventivo_id as number | null) ?? null,
      // Le fatture importate dall'XML si riscaricano sempre: il PDF viene rigenerato.
      pdf_url: (f.pdf_url as string | null) || (f.ha_xml ? `/api/fatture/${f.id}/pdf` : null),
      descrizione: descrizioneFattura(f.xml as string | null),
    })),
    canone: canone.canone ? { ...canone, canone: canone.canone } : null,
  };
}

/** Prima riga della fattura: dà un nome ai lavori fatturati senza preventivo. */
function descrizioneFattura(xml: string | null) {
  if (!xml) return null;
  try {
    return parseFattura(xml).linee[0]?.descrizione || null;
  } catch {
    return null;
  }
}

// P.IVA normalizzata (senza "IT", spazi e simboli).
const normPiva = (v: unknown) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^IT/, '');

/**
 * Fatture (alias f) che appartengono al cliente: le sue, quelle della società collegata
 * e quelle intestate alla sua P.IVA anche se archiviate su un'altra scheda
 * (es. lavori fatti per conto di un'agenzia e fatturati all'agenzia).
 */
function condizioneFatture(clienteId: number, piva: string) {
  return sql`(
    f.cliente_id = ${clienteId}
    OR f.intestatario_id IN (
      SELECT i.id FROM intestatari i
      WHERE i.cliente_id = ${clienteId}
         OR (${piva} <> '' AND upper(regexp_replace(regexp_replace(COALESCE(i.piva, ''), '[^A-Za-z0-9]', '', 'g'), '^IT', '', 'i')) = ${piva})
    )
    OR (${piva} <> '' AND upper(regexp_replace(regexp_replace(COALESCE(f.cliente_piva, ''), '[^A-Za-z0-9]', '', 'g'), '^IT', '', 'i')) = ${piva})
  )`;
}

/** La fattura è visibile (e scaricabile) da questo cliente dell'area? */
export async function fatturaDelCliente(fatturaId: number, clienteId: number) {
  await ensureFattureXmlSchema();
  const [c] = await sql`SELECT piva FROM clienti WHERE id = ${clienteId}`;
  if (!c) return false;
  const [r] = await sql`SELECT 1 FROM fatture f WHERE f.id = ${fatturaId} AND ${condizioneFatture(clienteId, normPiva(c.piva))}`;
  return !!r;
}
