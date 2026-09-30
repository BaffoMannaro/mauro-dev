import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { parseFattura } from '@/lib/fattura/parse';
import { archivioSelect, normalizzaId } from '@/lib/fattura/server';

// Salva (o aggiorna, se numero+anno esistono già) una fattura XML nell'archivio.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensureFattureXmlSchema();
  const { xml, con_logo } = await req.json().catch(() => ({}));

  let f;
  try {
    f = parseFattura(String(xml ?? ''));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Collega il cliente in anagrafica per P.IVA o codice fiscale, se esiste.
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
      ${f.committente.nome}, ${f.committente.piva}, ${imponibile}, ${contributo}, ${con_logo !== false}
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
  return NextResponse.json(salvata);
}
