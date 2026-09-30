import sql from '@/lib/db';
import { type Fattura } from './parse';
import { renderFatturaHtml, nomeFilePdf } from './html';

/** Colonne dell'archivio che servono alla pagina Fatture. */
export const archivioSelect = () => sql`
  SELECT id, numero, to_char(data, 'YYYY-MM-DD') AS data, anno, importo::float8 AS importo,
         imponibile::float8 AS imponibile, contributo::float8 AS contributo, stato,
         cliente_id, cliente_nome, cliente_piva, con_logo, xml
  FROM fatture
`;

/** Genera il PDF brandizzato con PDFShift e lo restituisce come download. */
export async function rispostaPdf(f: Fattura, logo: boolean): Promise<Response> {
  const pdfRes = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source: renderFatturaHtml(f, { logo }), format: 'A4', margin: '0' }),
  });

  if (!pdfRes.ok) {
    console.error('PDFShift error:', await pdfRes.text());
    return Response.json({ error: 'Generazione PDF non riuscita' }, { status: 500 });
  }

  return new Response(await pdfRes.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeFilePdf(f)}"`,
    },
  });
}

/** "IT 08654590721" → "08654590721" per confrontare P.IVA salvate in formati diversi. */
export const normalizzaId = (v: string | null) =>
  (v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^IT(?=\d{11}$)/, '');

/**
 * Salva (o aggiorna, se numero+anno esistono già) una fattura XML nell'archivio,
 * collegando il cliente in anagrafica per P.IVA o codice fiscale. Restituisce la riga salvata.
 */
export async function salvaFattura(f: Fattura, xml: string, conLogo: boolean) {
  const piva = normalizzaId(f.committente.piva);
  const cf = normalizzaId(f.committente.cf);
  const [cliente] = await sql`
    SELECT id FROM clienti
    WHERE (${piva} <> '' AND regexp_replace(regexp_replace(upper(coalesce(piva, '')), '[^A-Z0-9]', '', 'g'), '^IT(?=[0-9]{11}$)', '') = ${piva})
       OR (${cf} <> '' AND upper(coalesce(codice_fiscale, '')) = ${cf})
    ORDER BY id LIMIT 1
  `;

  const anno = Number(f.data.slice(0, 4));
  const imponibile = f.linee.reduce((s, l) => s + l.prezzoTotale, 0);
  const contributo = f.casse.reduce((s, c) => s + c.importo, 0);

  const [row] = await sql`
    INSERT INTO fatture (
      cliente_id, numero, importo, data, anno, xml, cliente_nome, cliente_piva,
      imponibile, contributo, con_logo
    ) VALUES (
      ${cliente?.id ?? null}, ${f.numero}, ${f.totaleDocumento}, ${f.data}, ${anno}, ${xml},
      ${f.committente.nome}, ${f.committente.piva}, ${imponibile}, ${contributo}, ${conLogo}
    )
    ON CONFLICT (numero, anno) WHERE xml IS NOT NULL DO UPDATE SET
      cliente_id = COALESCE(fatture.cliente_id, EXCLUDED.cliente_id),
      importo = EXCLUDED.importo, data = EXCLUDED.data, xml = EXCLUDED.xml,
      cliente_nome = EXCLUDED.cliente_nome, cliente_piva = EXCLUDED.cliente_piva,
      imponibile = EXCLUDED.imponibile, contributo = EXCLUDED.contributo,
      con_logo = EXCLUDED.con_logo, updated_at = NOW()
    RETURNING id
  `;
  // Il PDF è sempre rigenerato dall'XML: il link vale per admin e portale cliente.
  await sql`UPDATE fatture SET pdf_url = ${`/api/fatture/${row.id}/pdf`} WHERE id = ${row.id}`;

  const [salvata] = await sql`${archivioSelect()} WHERE id = ${row.id}`;
  return salvata;
}
