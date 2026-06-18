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
        meta JSONB,
        stato TEXT DEFAULT 'inviato',
        accettato_at TIMESTAMPTZ,
        accettato_ip TEXT,
        accettato_ua TEXT,
        accettato_nome TEXT,
        accettato_cognome TEXT,
        accettato_email TEXT,
        vuole_email BOOLEAN DEFAULT false,
        tranches_stato JSONB,
        lavoro_inizio DATE,
        lavoro_fine DATE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS meta JSONB`;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS accettato_nome TEXT`;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS accettato_cognome TEXT`;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS accettato_email TEXT`;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS vuole_email BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS tranches_stato JSONB`;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS lavoro_inizio DATE`;
    await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS lavoro_fine DATE`;

    return NextResponse.json({ ok: true, message: 'Database inizializzato' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
