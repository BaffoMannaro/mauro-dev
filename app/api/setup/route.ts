import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS preventivi (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        cliente_nome TEXT NOT NULL,
        cliente_azienda TEXT,
        cliente_email TEXT NOT NULL,
        oggetto TEXT NOT NULL,
        voci JSONB NOT NULL,
        note TEXT,
        scadenza DATE,
        totale DECIMAL(10,2) NOT NULL,
        iva BOOLEAN DEFAULT true,
        stato TEXT DEFAULT 'inviato',
        accettato_at TIMESTAMPTZ,
        accettato_ip TEXT,
        accettato_ua TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    return NextResponse.json({ ok: true, message: 'Database inizializzato' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
