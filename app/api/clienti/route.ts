import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensureClientiSchema } from '@/lib/schema';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();
  const clienti = await sql`SELECT * FROM clienti ORDER BY created_at DESC`;
  return NextResponse.json(clienti);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();

  const b = await req.json();
  if (!b.nome || !String(b.nome).trim()) {
    return NextResponse.json({ error: 'Il nome è obbligatorio' }, { status: 400 });
  }

  const [cliente] = await sql`
    INSERT INTO clienti (
      nome, azienda, email, telefono, piva, codice_fiscale,
      indirizzo, pec, codice_sdi, note, data_inizio
    ) VALUES (
      ${b.nome},
      ${b.azienda || null},
      ${b.email || null},
      ${b.telefono || null},
      ${b.piva || null},
      ${b.codice_fiscale || null},
      ${b.indirizzo || null},
      ${b.pec || null},
      ${b.codice_sdi || null},
      ${b.note || null},
      COALESCE(${b.data_inizio || null}::date, CURRENT_DATE)
    )
    RETURNING *
  `;

  // Collega i preventivi selezionati (import dallo storico accettati)
  if (Array.isArray(b.link_ids) && b.link_ids.length > 0) {
    for (const pid of b.link_ids) {
      await sql`UPDATE preventivi SET cliente_id = ${cliente.id}, updated_at = NOW() WHERE id = ${Number(pid)}`;
    }
  }
  // In alternativa collega tutti i preventivi con la stessa email non ancora associati
  if (b.link_email) {
    await sql`UPDATE preventivi SET cliente_id = ${cliente.id}, updated_at = NOW() WHERE cliente_email = ${b.link_email} AND cliente_id IS NULL`;
  }

  return NextResponse.json(cliente);
}
