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
  // Fonte del cliente (diretto / agenzia): divisione interna, mai mostrata al cliente.
  await sql`ALTER TABLE clienti ADD COLUMN IF NOT EXISTS fonte TEXT`;
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

// Archivio fatture da XML FatturaPA (sezione Fatture): stessa tabella del
// portale, così una fattura salvata compare anche nella scheda del cliente.
let ensuredFattureXml = false;

export async function ensureFattureXmlSchema() {
  await ensurePortaleSchema();
  if (ensuredFattureXml) return;
  // Una fattura importata può non avere (ancora) un cliente in anagrafica.
  await sql`ALTER TABLE fatture ALTER COLUMN cliente_id DROP NOT NULL`;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS xml TEXT`;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS anno INTEGER`;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS cliente_nome TEXT`;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS cliente_piva TEXT`;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS imponibile DECIMAL(10,2)`;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS contributo DECIMAL(10,2)`;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS con_logo BOOLEAN DEFAULT true`;
  // Numero fattura univoco per anno: ricaricare lo stesso XML aggiorna, non duplica.
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS fatture_xml_numero_anno
    ON fatture (numero, anno) WHERE xml IS NOT NULL
  `;
  // Società / dati fiscali degli intestatari delle fatture (fonte di verità: l'ultima fattura).
  // Separati dal "cliente" (persona/rapporto): un cliente può fatturare con più società.
  await sql`
    CREATE TABLE IF NOT EXISTS intestatari (
      id SERIAL PRIMARY KEY,
      chiave TEXT UNIQUE NOT NULL,
      denominazione TEXT NOT NULL,
      piva TEXT,
      codice_fiscale TEXT,
      indirizzo TEXT,
      localita TEXT,
      codice_destinatario TEXT,
      pec TEXT,
      cliente_id INTEGER,
      dati_al DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS intestatario_id INTEGER`;
  // Giorno in cui la fattura è stata segnata pagata: fa fede per l'incasso (principio di cassa).
  await sql`ALTER TABLE fatture ADD COLUMN IF NOT EXISTS pagata_il DATE`;
  await migraPagamentiFattura();
  ensuredFattureXml = true;
}

/**
 * Pagamenti (anche parziali) delle fatture. Idempotente: si può rilanciare senza duplicare.
 * - importo in centesimi interi; il riferimento è il totale documento della fattura (fatture.importo).
 * - Fatture già "pagata" senza pagamenti: un unico pagamento pari al totale, alla data
 *   pagata_il (o la data fattura per quelle segnate prima di ottobre 2026). Le "da_pagare" restano vuote.
 * - Da qui in poi stato e pagata_il di fatture derivano dai pagamenti (ricalcolaStatoFattura).
 */
export async function migraPagamentiFattura() {
  await sql`
    CREATE TABLE IF NOT EXISTS pagamenti_fattura (
      id SERIAL PRIMARY KEY,
      fattura_id INTEGER NOT NULL REFERENCES fatture(id) ON DELETE CASCADE,
      data DATE NOT NULL,
      importo INTEGER NOT NULL CHECK (importo > 0),
      metodo TEXT,
      nota TEXT,
      creato_il TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS pagamenti_fattura_fattura ON pagamenti_fattura (fattura_id, data)`;
  await sql`CREATE INDEX IF NOT EXISTS pagamenti_fattura_data ON pagamenti_fattura (data)`;
  await sql`
    INSERT INTO pagamenti_fattura (fattura_id, data, importo, nota)
    SELECT f.id, COALESCE(f.pagata_il, f.data, f.created_at::date), round(f.importo * 100)::int,
           'Saldo registrato prima dei pagamenti parziali'
    FROM fatture f
    WHERE f.stato = 'pagata' AND f.importo > 0
      AND NOT EXISTS (SELECT 1 FROM pagamenti_fattura p WHERE p.fattura_id = f.id)
  `;
  // pagata_il coerente col pagamento appena creato (le fatture segnate senza giorno).
  await sql`
    UPDATE fatture f SET pagata_il = p.data
    FROM (SELECT fattura_id, max(data) AS data FROM pagamenti_fattura GROUP BY fattura_id) p
    WHERE p.fattura_id = f.id AND f.stato = 'pagata' AND f.pagata_il IS NULL
  `;
}
