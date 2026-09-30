// Validità dei preventivi: al massimo 15 giorni da quando la scadenza viene fissata.
// Il preventivo resta accettabile fino alle 23:59 (ora italiana) del giorno di scadenza.
// Funzioni pure: usate sia dal server sia dalla pagina pubblica.

export const VALIDITA_MAX_GIORNI = 15;

/** Data di oggi in Italia, YYYY-MM-DD. */
export const oggiRoma = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });

export function aggiungiGiorni(giorno: string, n: number) {
  const d = new Date(`${giorno}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Giorno (YYYY-MM-DD) da un valore del database: le colonne DATE arrivano come Date a
 * mezzanotte locale, i TIMESTAMPTZ come istanti; entrambi letti in ora italiana.
 */
export function giorno(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  if (v instanceof Date && d.getHours() === 0 && d.getMinutes() === 0) {
    // DATE di Postgres: mezzanotte nel fuso del server, il giorno è quello locale.
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
}

/** Scadenza richiesta, limitata a 15 giorni da `da` (oggi di default). Senza richiesta: il massimo. */
export function limitaScadenza(richiesta: string | null | undefined, da = oggiRoma()) {
  const max = aggiungiGiorni(da, VALIDITA_MAX_GIORNI);
  const r = richiesta ? giorno(richiesta) : null;
  return r && r < max ? r : max;
}

/** Scadenza effettiva: quella salvata oppure, per i vecchi preventivi senza, creazione + 15 giorni. */
export function scadenzaEffettiva(p: { scadenza?: unknown; created_at?: unknown }): string {
  return giorno(p.scadenza) ?? aggiungiGiorni(giorno(p.created_at) ?? oggiRoma(), VALIDITA_MAX_GIORNI);
}

export const isScaduto = (p: { scadenza?: unknown; created_at?: unknown }) => scadenzaEffettiva(p) < oggiRoma();
