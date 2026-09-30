import sql from './db';
import { bottone, EMAIL_MAURO, esc, inviaEmail, layoutEmail } from './email';
import { inviaEmailAccettazione } from './email-accettazione';
import { aggiungiGiorni, isScaduto, oggiRoma, scadenzaEffettiva, VALIDITA_MAX_GIORNI } from './scadenza';

// Accettazione tardiva: se il preventivo è scaduto, il cliente può chiedere di accettarlo
// lo stesso. Mauro riceve una email e dal gestionale (o da Claude) decide:
//  - approva: il preventivo risulta accettato con i dati della richiesta, parte la conferma al cliente;
//  - riapri:  nuova scadenza a 15 giorni da oggi, il cliente riceve il link per accettare;
//  - rifiuta: la richiesta viene chiusa (nessuna email).

const SITE_URL =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://maurodev.it');
const APP_URL = process.env.APP_HOST ? `https://${process.env.APP_HOST}` : 'https://app.maurodev.it';

export interface RichiestaTardiva {
  nome: string;
  cognome: string;
  email: string;
  messaggio: string | null;
  ip: string | null;
  ua: string | null;
  inviata_at: string;
  esito?: 'approvata' | 'riaperta' | 'rifiutata';
  esito_at?: string;
}

let ensured = false;
export async function ensureTardivaSchema() {
  if (ensured) return;
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS richiesta_tardiva JSONB`;
  ensured = true;
}

const euro = (n: number) => `€ ${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const dataIt = (g: string) =>
  new Date(`${g}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' });

/** Richiesta in attesa di una decisione (non ancora gestita). */
export const inAttesa = (r: RichiestaTardiva | null | undefined): r is RichiestaTardiva => !!r && !r.esito;

export type EsitoRichiesta = { ok: true; gia_inviata?: boolean } | { ok: false; errore: string; status: number };

export async function registraRichiestaTardiva(
  token: string,
  dati: { nome: string; cognome: string; email: string; messaggio?: string | null; ip: string | null; ua: string | null }
): Promise<EsitoRichiesta> {
  await ensureTardivaSchema();
  const [p] = await sql`SELECT * FROM preventivi WHERE token = ${token}`;
  if (!p) return { ok: false, errore: 'Preventivo non trovato', status: 404 };
  if (p.stato !== 'inviato') return { ok: false, errore: 'Il preventivo non è più accettabile.', status: 400 };
  if (!isScaduto(p)) return { ok: false, errore: 'Il preventivo è ancora valido: puoi accettarlo direttamente.', status: 400 };
  // Una richiesta alla volta: niente email doppie se il cliente preme più volte.
  if (inAttesa(p.richiesta_tardiva)) return { ok: true, gia_inviata: true };

  const richiesta: RichiestaTardiva = {
    nome: dati.nome.trim().slice(0, 80),
    cognome: dati.cognome.trim().slice(0, 80),
    email: dati.email.trim().slice(0, 200),
    messaggio: dati.messaggio?.trim().slice(0, 2000) || null,
    ip: dati.ip,
    ua: dati.ua,
    inviata_at: new Date().toISOString(),
  };
  await sql`UPDATE preventivi SET richiesta_tardiva = ${JSON.stringify(richiesta)}::jsonb, updated_at = NOW() WHERE id = ${p.id}`;
  return { ok: true };
}

/** Email a Mauro con la richiesta e il link per gestirla. */
export async function notificaRichiestaTardiva(token: string) {
  const [p] = await sql`SELECT * FROM preventivi WHERE token = ${token}`;
  const r = p?.richiesta_tardiva as RichiestaTardiva | null;
  if (!p || !inAttesa(r)) return;
  const chi = `${r.nome} ${r.cognome}`;
  const cliente = p.cliente_azienda || p.cliente_nome;
  const gestisci = `${APP_URL}/?preventivo=${p.id}`;

  const html = layoutEmail({
    titolo: 'Richiesta di accettazione tardiva',
    anteprima: `${chi} vuole accettare "${p.oggetto}", scaduto il ${dataIt(scadenzaEffettiva(p))}`,
    corpo: `
      <p style="margin:0 0 12px;font-size:18px;font-weight:700;">Richiesta di accettazione tardiva</p>
      <p style="margin:0 0 16px;"><strong>${esc(chi)}</strong> (${esc(cliente)}) vuole accettare <strong>${esc(p.oggetto)}</strong> — ${euro(Number(p.totale))}, scaduto il ${dataIt(scadenzaEffettiva(p))}.</p>
      ${r.messaggio ? `<p style="margin:0 0 16px;padding:12px 16px;background:#F1F0EA;border-radius:10px;white-space:pre-wrap;">${esc(r.messaggio)}</p>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4C4D45;margin:0 0 20px;">
        <tr><td style="padding:3px 16px 3px 0;color:#8B8B80;">Email</td><td>${esc(r.email)}</td></tr>
        <tr><td style="padding:3px 16px 3px 0;color:#8B8B80;">Inviata</td><td>${new Date(r.inviata_at).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}</td></tr>
      </table>
      <p style="margin:0 0 12px;">Dal gestionale puoi <strong>approvarla</strong> (il preventivo risulta accettato e parte la conferma al cliente), <strong>riaprire il preventivo</strong> per altri ${VALIDITA_MAX_GIORNI} giorni oppure rifiutarla.</p>
      <p style="margin:0;">${bottone(gestisci, 'Gestisci la richiesta')}${bottone(`${SITE_URL}/p/${p.token}`, 'Vedi il preventivo', false)}</p>`,
  });

  try {
    await inviaEmail({
      to: EMAIL_MAURO,
      subject: `⏰ Accettazione tardiva: ${cliente} — ${p.oggetto}`,
      html,
      text:
        `${chi} (${cliente}, ${r.email}) chiede di accettare "${p.oggetto}" (${euro(Number(p.totale))}), ` +
        `scaduto il ${dataIt(scadenzaEffettiva(p))}.\n${r.messaggio ? `\nMessaggio: ${r.messaggio}\n` : ''}\nGestisci: ${gestisci}`,
      replyTo: r.email,
    });
  } catch (e) {
    console.error(`[email] richiesta tardiva preventivo ${p.id}:`, (e as Error).message);
  }
}

/** Decisione di Mauro sulla richiesta. Le email partono dopo, con `dopo()` (after o await). */
export async function gestisciRichiestaTardiva(
  id: number,
  azione: 'approva' | 'riapri' | 'rifiuta',
  dopo: (fn: () => Promise<void>) => void | Promise<void>
) {
  await ensureTardivaSchema();
  const [p] = await sql`SELECT * FROM preventivi WHERE id = ${id}`;
  if (!p) throw new Error(`Preventivo ${id} non trovato`);
  const r = p.richiesta_tardiva as RichiestaTardiva | null;
  if (azione !== 'riapri' && !inAttesa(r)) throw new Error('Nessuna richiesta di accettazione tardiva in attesa');
  if (p.stato !== 'inviato') throw new Error(`Il preventivo è già "${p.stato}"`);

  const chiusa = r ? JSON.stringify({ ...r, esito: { approva: 'approvata', riapri: 'riaperta', rifiuta: 'rifiutata' }[azione], esito_at: new Date().toISOString() }) : null;

  if (azione === 'approva' && r) {
    const [row] = await sql`
      UPDATE preventivi SET
        stato = 'accettato', accettato_at = NOW(), accettato_ip = ${r.ip}, accettato_ua = ${r.ua},
        accettato_nome = ${r.nome}, accettato_cognome = ${r.cognome}, accettato_email = ${r.email},
        richiesta_tardiva = ${chiusa}::jsonb, updated_at = NOW()
      WHERE id = ${id} RETURNING *`;
    await dopo(() => inviaEmailAccettazione(id));
    return row;
  }

  if (azione === 'riapri') {
    const scadenza = aggiungiGiorni(oggiRoma(), VALIDITA_MAX_GIORNI);
    const [row] = await sql`
      UPDATE preventivi SET scadenza = ${scadenza}, richiesta_tardiva = COALESCE(${chiusa}::jsonb, richiesta_tardiva), updated_at = NOW()
      WHERE id = ${id} RETURNING *`;
    const destinatario = r?.email || p.cliente_email;
    if (r && destinatario) await dopo(() => emailRiapertura(row, destinatario, r.nome));
    return row;
  }

  const [row] = await sql`UPDATE preventivi SET richiesta_tardiva = ${chiusa}::jsonb, updated_at = NOW() WHERE id = ${id} RETURNING *`;
  return row;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function emailRiapertura(p: any, to: string, nome: string) {
  const link = `${SITE_URL}/p/${p.token}#accettazione`;
  const fino = dataIt(scadenzaEffettiva(p));
  try {
    await inviaEmail({
      to,
      subject: `Preventivo di nuovo valido — ${p.oggetto}`,
      replyTo: EMAIL_MAURO,
      html: layoutEmail({
        titolo: 'Preventivo di nuovo valido',
        anteprima: `Puoi accettare "${p.oggetto}" fino al ${fino}`,
        corpo: `
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;">Ciao ${esc(nome)}!</p>
          <p style="margin:0 0 16px;">Ho riaperto il preventivo <strong>${esc(p.oggetto)}</strong>: puoi accettarlo online fino al <strong>${fino}</strong>.</p>
          <p style="margin:0 0 20px;">${bottone(link, 'Accetta il preventivo')}</p>
          <p style="margin:0;font-size:13px;color:#8B8B80;">Per qualsiasi domanda rispondi pure a questa email.</p>`,
      }),
      text: `Ciao ${nome}, ho riaperto il preventivo "${p.oggetto}": puoi accettarlo fino al ${fino}.\n${link}\n\nMauro Altamura · maurodev.it`,
    });
  } catch (e) {
    console.error(`[email] riapertura preventivo ${p.id}:`, (e as Error).message);
  }
}
