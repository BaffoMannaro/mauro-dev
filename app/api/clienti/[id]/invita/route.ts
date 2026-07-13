import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensurePortaleSchema } from '@/lib/schema';
import { createMagicToken } from '@/lib/client-auth';

const CLIENT_URL =
  process.env.CLIENT_URL || `https://${process.env.CLIENT_HOST || 'area.maurodev.it'}`;

// Genera un link di accesso (magic link) per il cliente e attiva il portale.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensurePortaleSchema();
  const { id } = await params;

  const [cliente] = await sql`SELECT id FROM clienti WHERE id = ${id}`;
  if (!cliente) return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });

  await sql`UPDATE clienti SET portale_attivo = true WHERE id = ${id}`;
  const token = await createMagicToken(Number(id));

  return NextResponse.json({ url: `${CLIENT_URL}/entra?token=${token}` });
}
