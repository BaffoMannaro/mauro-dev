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

  try {
    const [t] = await sql`SELECT id FROM clienti WHERE id = ${target}`;
    const [src] = await sql`SELECT * FROM clienti WHERE id = ${source}`;
    if (!t || !src) return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });

    // 1. Riassegna i preventivi del source al target
    await sql`UPDATE preventivi SET cliente_id = ${target}, updated_at = NOW() WHERE cliente_id = ${source}`;

    // 2. Eredita i campi anagrafici mancanti + data inizio più antica
    //    (parametri dal source, niente self-join: più robusto)
    await sql`
      UPDATE clienti SET
        azienda        = COALESCE(NULLIF(azienda, ''), ${src.azienda || null}),
        email          = COALESCE(NULLIF(email, ''), ${src.email || null}),
        telefono       = COALESCE(NULLIF(telefono, ''), ${src.telefono || null}),
        piva           = COALESCE(NULLIF(piva, ''), ${src.piva || null}),
        codice_fiscale = COALESCE(NULLIF(codice_fiscale, ''), ${src.codice_fiscale || null}),
        indirizzo      = COALESCE(NULLIF(indirizzo, ''), ${src.indirizzo || null}),
        pec            = COALESCE(NULLIF(pec, ''), ${src.pec || null}),
        codice_sdi     = COALESCE(NULLIF(codice_sdi, ''), ${src.codice_sdi || null}),
        note           = COALESCE(NULLIF(note, ''), ${src.note || null}),
        data_inizio    = LEAST(data_inizio, ${src.data_inizio || null}::date),
        updated_at     = NOW()
      WHERE id = ${target}
    `;

    // 3. Elimina il cliente assorbito
    await sql`DELETE FROM clienti WHERE id = ${source}`;

    const [cliente] = await sql`SELECT * FROM clienti WHERE id = ${target}`;
    return NextResponse.json(cliente);
  } catch (error) {
    console.error('merge clienti error:', error);
    return NextResponse.json({ error: 'Errore durante l\'unione', detail: String(error) }, { status: 500 });
  }
}
