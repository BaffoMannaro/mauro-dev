import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { nanoid } from 'nanoid';

// GET — lista tutti i preventivi (solo admin)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const preventivi = await sql`
    SELECT * FROM preventivi ORDER BY created_at DESC
  `;
  return NextResponse.json(preventivi);
}

// POST — crea nuovo preventivo (solo admin)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const body = await req.json();
  const token = nanoid(8);

  const voci = body.voci || [];
  const totale = voci.reduce((acc: number, v: { quantita: number; prezzo: number }) => 
    acc + v.quantita * v.prezzo, 0
  );

  const [preventivo] = await sql`
    INSERT INTO preventivi (
      token, cliente_nome, cliente_azienda, cliente_email,
      oggetto, voci, note, scadenza, totale, iva
    ) VALUES (
      ${token},
      ${body.cliente.nome},
      ${body.cliente.azienda || null},
      ${body.cliente.email},
      ${body.oggetto},
      ${JSON.stringify(body.voci)},
      ${body.note || null},
      ${body.scadenza || null},
      ${totale},
      ${body.iva !== false}
    )
    RETURNING *
  `;

  return NextResponse.json(preventivo);
}
