import sql from './db';

// Tracciamento delle aperture della pagina pubblica di un preventivo (/p/[token]).
// Registrato dal browser (non dal semplice caricamento del link), così le anteprime di
// WhatsApp/Gmail/Telegram e la generazione del PDF non contano. Niente IP salvato:
// solo città/paese dai dati di Vercel, tipo di dispositivo e browser.

let ensured = false;

export async function ensureVisiteSchema() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS preventivi_visite (
      id SERIAL PRIMARY KEY,
      preventivo_id INTEGER NOT NULL,
      visita_id TEXT UNIQUE NOT NULL,
      iniziata_at TIMESTAMPTZ DEFAULT NOW(),
      ultima_at TIMESTAMPTZ DEFAULT NOW(),
      durata_s INTEGER DEFAULT 0,
      sezioni TEXT[] DEFAULT '{}',
      pdf BOOLEAN DEFAULT false,
      dispositivo TEXT,
      browser TEXT,
      sistema TEXT,
      citta TEXT,
      paese TEXT,
      referrer TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS preventivi_visite_prev ON preventivi_visite (preventivo_id, iniziata_at DESC)`;
  ensured = true;
}

/** Robot, anteprime dei link e browser automatici (es. generazione PDF). */
export const isBot = (ua: string) =>
  /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype|headless|pdfshift|lighthouse|curl|wget|python|node-fetch/i.test(ua);

export function descriviUA(ua: string) {
  const dispositivo = /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop';
  const sistema = /iPhone|iPad|iOS/i.test(ua)
    ? 'iOS'
    : /Android/i.test(ua)
      ? 'Android'
      : /Windows/i.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : null;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /SamsungBrowser/.test(ua)
        ? 'Samsung Internet'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Chrome\//.test(ua)
            ? 'Chrome'
            : /Safari\//.test(ua)
              ? 'Safari'
              : null;
  return { dispositivo, sistema, browser };
}

export interface Visita {
  id: number;
  iniziata_at: string;
  ultima_at: string;
  durata_s: number;
  sezioni: string[];
  pdf: boolean;
  dispositivo: string | null;
  browser: string | null;
  sistema: string | null;
  citta: string | null;
  paese: string | null;
}

export interface RiepilogoVisite {
  aperture: number;
  dispositivi: number; // combinazioni distinte dispositivo/browser/città (stima, senza cookie)
  prima: string | null;
  ultima: string | null;
  tempo_totale_s: number;
  pdf_scaricati: number;
  sezioni_lette: string[];
}

export async function visiteDelPreventivo(preventivoId: number, limite = 50) {
  await ensureVisiteSchema();
  const visite = (await sql`
    SELECT id, iniziata_at, ultima_at, durata_s, sezioni, pdf, dispositivo, browser, sistema, citta, paese
    FROM preventivi_visite WHERE preventivo_id = ${preventivoId}
    ORDER BY iniziata_at DESC LIMIT ${limite}
  `) as Visita[];
  const [r] = await sql`
    SELECT count(*)::int AS aperture,
           count(DISTINCT concat_ws('|', dispositivo, browser, sistema, citta))::int AS dispositivi,
           min(iniziata_at) AS prima, max(ultima_at) AS ultima,
           COALESCE(sum(durata_s), 0)::int AS tempo_totale_s,
           count(*) FILTER (WHERE pdf)::int AS pdf_scaricati,
           ARRAY(SELECT DISTINCT unnest(sezioni) FROM preventivi_visite WHERE preventivo_id = ${preventivoId}) AS sezioni_lette
    FROM preventivi_visite WHERE preventivo_id = ${preventivoId}
  `;
  return { riepilogo: r as RiepilogoVisite, visite };
}

/** Aperture per preventivo, per gli elenchi (gestionale e connettore). */
export async function aperturePerPreventivo(): Promise<Record<number, { aperture: number; ultima: string }>> {
  await ensureVisiteSchema();
  const rows = await sql`
    SELECT preventivo_id, count(*)::int AS aperture, max(ultima_at) AS ultima
    FROM preventivi_visite GROUP BY preventivo_id
  `;
  return Object.fromEntries(rows.map((r) => [r.preventivo_id, { aperture: r.aperture, ultima: r.ultima }]));
}
