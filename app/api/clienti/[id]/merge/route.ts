import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensureClientiSchema } from '@/lib/schema';

// Unisce `source_id` nel cliente `id` (target):
// - i preventivi del source vengono riassegnati al target
// - i campi anagrafici vuoti del target vengono ereditati dal source
// - la data di inizio rapporto diventa la più antica tra le due
// - il cliente source viene eliminato
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();

  const { id } = await params;
  const target = Number(id);
  const body = await req.json();
  const source = Number(body.source_id);

  if (!source || !target || source === target) {
    return NextResponse.json({ error: 'Cliente da unire non valido' }, { status: 400 });
  }

  const [t] = await sql`SELECT id FROM clienti WHERE id = ${target}`;
  const [s] = await sql`SELECT id FROM clienti WHERE id = ${source}`;
  if (!t || !s) return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });

  // 1. Riassegna i preventivi del source al target
  await sql`UPDATE preventivi SET cliente_id = ${target}, updated_at = NOW() WHERE cliente_id = ${source}`;

  // 2. Eredita i campi anagrafici mancanti + data inizio più antica
  await sql`
    UPDATE clienti AS tgt SET
      azienda        = COALESCE(NULLIF(tgt.azienda, ''), src.azienda),
      email          = COALESCE(NULLIF(tgt.email, ''), src.email),
      telefono       = COALESCE(NULLIF(tgt.telefono, ''), src.telefono),
      piva           = COALESCE(NULLIF(tgt.piva, ''), src.piva),
      codice_fiscale = COALESCE(NULLIF(tgt.codice_fiscale, ''), src.codice_fiscale),
      indirizzo      = COALESCE(NULLIF(tgt.indirizzo, ''), src.indirizzo),
      pec            = COALESCE(NULLIF(tgt.pec, ''), src.pec),
      codice_sdi     = COALESCE(NULLIF(tgt.codice_sdi, ''), src.codice_sdi),
      note           = COALESCE(NULLIF(tgt.note, ''), src.note),
      data_inizio    = LEAST(tgt.data_inizio, src.data_inizio),
      updated_at     = NOW()
    FROM clienti AS src
    WHERE tgt.id = ${target} AND src.id = ${source}
  `;

  // 3. Elimina il cliente assorbito
  await sql`DELETE FROM clienti WHERE id = ${source}`;

  const [cliente] = await sql`SELECT * FROM clienti WHERE id = ${target}`;
  return NextResponse.json(cliente);
}
