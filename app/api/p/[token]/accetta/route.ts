import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';
  const body = await req.json().catch(() => ({}));
  const { nome, cognome, email, vuole_email } = body;

  const rows = await sql`SELECT * FROM preventivi WHERE token = ${token}`;
  const preventivo = rows[0];

  if (!preventivo) {
    return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
  }

  if (preventivo.stato !== 'inviato') {
    return NextResponse.json({ error: 'Preventivo già processato' }, { status: 400 });
  }

  await sql`
    ALTER TABLE preventivi 
    ADD COLUMN IF NOT EXISTS accettato_nome TEXT,
    ADD COLUMN IF NOT EXISTS accettato_cognome TEXT,
    ADD COLUMN IF NOT EXISTS accettato_email TEXT,
    ADD COLUMN IF NOT EXISTS vuole_email BOOLEAN DEFAULT false
  `;

  const updated = await sql`
    UPDATE preventivi
    SET 
      stato = 'accettato',
      accettato_at = NOW(),
      accettato_ip = ${ip},
      accettato_ua = ${ua},
      accettato_nome = ${nome || null},
      accettato_cognome = ${cognome || null},
      accettato_email = ${email || null},
      vuole_email = ${vuole_email || false},
      updated_at = NOW()
    WHERE token = ${token}
    RETURNING *
  `;

  return NextResponse.json(updated[0]);
}
