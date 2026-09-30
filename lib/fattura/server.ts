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
