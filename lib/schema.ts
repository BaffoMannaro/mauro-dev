import sql from './db';

// Idempotente e leggero (IF NOT EXISTS). Chiamato all'inizio delle pagine/route
// dei clienti così la sezione funziona senza dover lanciare /api/setup a mano.
// Il flag evita di ripetere la DDL nella stessa istanza serverless calda.
let ensured = false;

export async function ensureClientiSchema() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS clienti (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      azienda TEXT,
      email TEXT,
      telefono TEXT,
      piva TEXT,
      codice_fiscale TEXT,
      indirizzo TEXT,
      pec TEXT,
      codice_sdi TEXT,
      note TEXT,
      data_inizio DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS cliente_id INTEGER`;
  await sql`
    CREATE TABLE IF NOT EXISTS impostazioni (
      chiave TEXT PRIMARY KEY,
      valore JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  ensured = true;
}

// Schema aggiuntivo per il portale cliente (Fase 1): fatture + flag portale.
let ensuredPortale = false;

export async function ensurePortaleSchema() {
  await ensureClientiSchema();
  if (ensuredPortale) return;
  await sql`
    CREATE TABLE IF NOT EXISTS fatture (
      id SERIAL PRIMARY KEY,
      cliente_id INTEGER NOT NULL,
      preventivo_id INTEGER,
      numero TEXT,
      importo DECIMAL(10,2),
      data DATE,
      stato TEXT DEFAULT 'da_pagare',
      pdf_url TEXT,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Flag e tracciamento accessi lato cliente.
  await sql`ALTER TABLE clienti ADD COLUMN IF NOT EXISTS portale_attivo BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE clienti ADD COLUMN IF NOT EXISTS ultimo_accesso_portale TIMESTAMPTZ`;
  // Consente al preventivo di segnare l'eventuale rifiuto dal portale.
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS rifiutato_at TIMESTAMPTZ`;
  ensuredPortale = true;
}
