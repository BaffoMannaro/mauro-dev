import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensureClientiSchema } from '@/lib/schema';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();

  const { id } = await params;
  const [cliente] = await sql`SELECT * FROM clienti WHERE id = ${id}`;
  if (!cliente) return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });

  const preventivi = await sql`SELECT * FROM preventivi WHERE cliente_id = ${id} ORDER BY created_at DESC`;
  return NextResponse.json({ cliente, preventivi });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();

  const { id } = await params;
  const b = await req.json();

  // COALESCE: i campi non inviati (undefined → null) non vengono toccati;
  // una stringa vuota invece azzera il campo.
  const [cliente] = await sql`
    UPDATE clienti SET
      nome           = COALESCE(${b.nome ?? null}, nome),
      azienda        = COALESCE(${b.azienda ?? null}, azienda),
      email          = COALESCE(${b.email ?? null}, email),
      telefono       = COALESCE(${b.telefono ?? null}, telefono),
      piva           = COALESCE(${b.piva ?? null}, piva),
      codice_fiscale = COALESCE(${b.codice_fiscale ?? null}, codice_fiscale),
      indirizzo      = COALESCE(${b.indirizzo ?? null}, indirizzo),
      pec            = COALESCE(${b.pec ?? null}, pec),
      codice_sdi     = COALESCE(${b.codice_sdi ?? null}, codice_sdi),
      note           = COALESCE(${b.note ?? null}, note),
      data_inizio    = COALESCE(${b.data_inizio ?? null}::date, data_inizio),
      updated_at     = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  if (!cliente) return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });

  // Associazione / dissociazione preventivi
  if (Array.isArray(b.link_ids)) {
    for (const pid of b.link_ids) {
      await sql`UPDATE preventivi SET cliente_id = ${id}, updated_at = NOW() WHERE id = ${Number(pid)}`;
    }
  }
  if (Array.isArray(b.unlink_ids)) {
    for (const pid of b.unlink_ids) {
      await sql`UPDATE preventivi SET cliente_id = NULL, updated_at = NOW() WHERE id = ${Number(pid)} AND cliente_id = ${id}`;
    }
  }

  return NextResponse.json(cliente);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();

  const { id } = await params;
  // Scollega i preventivi ma NON li elimina
  await sql`UPDATE preventivi SET cliente_id = NULL, updated_at = NOW() WHERE cliente_id = ${id}`;
  await sql`DELETE FROM clienti WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
