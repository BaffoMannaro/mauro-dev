import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { ensureClientiSchema } from '@/lib/schema';

// Key-value store per le preferenze (es. ordinamento clienti).
// Globale: l'app è a utente singolo, quindi la preferenza vale su ogni dispositivo.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();

  const chiave = req.nextUrl.searchParams.get('chiave');
  if (!chiave) return NextResponse.json({ error: 'chiave mancante' }, { status: 400 });

  const [row] = await sql`SELECT valore FROM impostazioni WHERE chiave = ${chiave}`;
  return NextResponse.json({ valore: row?.valore ?? null });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await ensureClientiSchema();

  const { chiave, valore } = await req.json();
  if (!chiave) return NextResponse.json({ error: 'chiave mancante' }, { status: 400 });

  await sql`
    INSERT INTO impostazioni (chiave, valore, updated_at)
    VALUES (${chiave}, ${JSON.stringify(valore)}::jsonb, NOW())
    ON CONFLICT (chiave) DO UPDATE SET valore = EXCLUDED.valore, updated_at = NOW()
  `;
  return NextResponse.json({ ok: true });
}
