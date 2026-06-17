import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';

  const [preventivo] = await sql`
    SELECT * FROM preventivi WHERE token = ${token}
  `;

  if (!preventivo) {
    return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
  }

  if (preventivo.stato !== 'inviato') {
    return NextResponse.json({ error: 'Preventivo già processato' }, { status: 400 });
  }

  const [updated] = await sql`
    UPDATE preventivi
    SET 
      stato = 'accettato',
      accettato_at = NOW(),
      accettato_ip = ${ip},
      accettato_ua = ${ua},
      updated_at = NOW()
    WHERE token = ${token}
    RETURNING *
  `;

  return NextResponse.json(updated);
}