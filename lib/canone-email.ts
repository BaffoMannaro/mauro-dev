import sql from './db';
import { bottone, EMAIL_MAURO, esc, inviaEmail, layoutEmail } from './email';
import type { Richiesta } from './canone';

// Email del canone ore. Non lanciano: un errore di invio non deve bloccare la richiesta.

const AREA_URL = process.env.CLIENT_URL || `https://${process.env.CLIENT_HOST || 'area.maurodev.it'}`;
const APP_URL = process.env.APP_HOST ? `https://${process.env.APP_HOST}` : 'https://app.maurodev.it';

const ore = (n: number | null) => (n == null ? '' : `${String(n).replace('.', ',')} ${n === 1 ? 'ora' : 'ore'}`);
const giorno = (d: string | null) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

async function cliente(cid: number) {
  const [c] = await sql`SELECT id, nome, azienda, email FROM clienti WHERE id = ${cid}`;
  return c as { id: number; nome: string; azienda: string | null; email: string | null } | undefined;
}

async function invia(e: Parameters<typeof inviaEmail>[0], etichetta: string) {
  try {
    await inviaEmail(e);
  } catch (err) {
    console.error(`[email] ${etichetta}:`, (err as Error).message);
  }
}

/** Nuova richiesta dal cliente: avviso a Mauro. */
export async function notificaNuovaRichiesta(cid: number, r: Richiesta) {
  const c = await cliente(cid);
  if (!c) return;
  const chi = c.azienda || c.nome;
  const link = `${APP_URL}/clienti/${cid}`;
  await invia(
    {
      to: EMAIL_MAURO,
      subject: `${r.urgente ? 'URGENTE: ' : ''}Nuova richiesta da ${chi}${r.sito ? ` (${r.sito})` : ''}`,
      html: layoutEmail({
        titolo: 'Nuova richiesta',
        anteprima: r.testo.slice(0, 120),
        corpo: `
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;">Nuova richiesta${r.urgente ? ' urgente' : ''}</p>
          <p style="margin:0 0 12px;"><strong>${esc(c.nome)}</strong>${r.sito ? ` · ${esc(r.sito)}` : ''}</p>
          <p style="margin:0 0 16px;padding:12px 16px;background:#F1F0EA;border-radius:10px;white-space:pre-wrap;">${esc(r.testo)}</p>
          <p style="margin:0 0 12px;">Rispondi con una stima in ore dal gestionale o con lo strumento rispondi_richiesta.</p>
          <p style="margin:0;">${bottone(link, 'Apri la scheda cliente')}</p>`,
      }),
      text: `Nuova richiesta da ${c.nome}${r.sito ? ` (${r.sito})` : ''}:\n\n${r.testo}\n\n${link}`,
      replyTo: c.email ?? undefined,
    },
    `nuova richiesta ${r.id}`
  );
}

/** Stima inviata: avviso al cliente, che la approva dalla pagina. */
export async function notificaStima(cid: number, r: Richiesta) {
  const c = await cliente(cid);
  if (!c?.email) return;
  const link = `${AREA_URL}/portale`;
  await invia(
    {
      to: c.email,
      subject: `Stima per la tua richiesta${r.sito ? ` su ${r.sito}` : ''}: ${ore(r.ore_stimate)}`,
      replyTo: EMAIL_MAURO,
      html: layoutEmail({
        titolo: 'Stima della richiesta',
        anteprima: `Servono circa ${ore(r.ore_stimate)}`,
        corpo: `
          <p style="margin:0 0 12px;">Ciao ${esc(c.nome.split(' ')[0])},</p>
          <p style="margin:0 0 12px;">per questa richiesta servono circa <strong>${ore(r.ore_stimate)}</strong>${
            r.consegna_prevista ? `, con consegna prevista il <strong>${giorno(r.consegna_prevista)}</strong>` : ''
          }.</p>
          <p style="margin:0 0 16px;padding:12px 16px;background:#F1F0EA;border-radius:10px;white-space:pre-wrap;">${esc(r.testo)}</p>
          ${r.risposta ? `<p style="margin:0 0 16px;white-space:pre-wrap;">${esc(r.risposta)}</p>` : ''}
          <p style="margin:0 0 12px;">Se ti va bene, approvala dalla tua pagina e parto.</p>
          <p style="margin:0;">${bottone(link, 'Vedi e approva')}</p>
          <p style="margin:16px 0 0;">Mauro</p>`,
      }),
      text:
        `Ciao ${c.nome.split(' ')[0]},\n\nper questa richiesta servono circa ${ore(r.ore_stimate)}` +
        `${r.consegna_prevista ? `, con consegna prevista il ${giorno(r.consegna_prevista)}` : ''}.\n\n` +
        `${r.testo}\n\n${r.risposta ? `${r.risposta}\n\n` : ''}Se ti va bene, approvala da qui: ${link}\n\nMauro`,
    },
    `stima richiesta ${r.id}`
  );
}

/** Il cliente ha approvato o rifiutato la stima: avviso a Mauro. */
export async function notificaDecisione(cid: number, r: Richiesta) {
  const c = await cliente(cid);
  if (!c) return;
  const ok = r.stato === 'approvata';
  await invia(
    {
      to: EMAIL_MAURO,
      subject: `${c.azienda || c.nome}: stima ${ok ? 'approvata' : 'rifiutata'} (${ore(r.ore_stimate)})`,
      html: layoutEmail({
        titolo: ok ? 'Stima approvata' : 'Stima rifiutata',
        anteprima: r.testo.slice(0, 120),
        corpo: `
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;">Stima ${ok ? 'approvata' : 'rifiutata'}</p>
          <p style="margin:0 0 12px;"><strong>${esc(c.nome)}</strong>${r.sito ? ` · ${esc(r.sito)}` : ''} · ${ore(r.ore_stimate)}</p>
          <p style="margin:0 0 16px;padding:12px 16px;background:#F1F0EA;border-radius:10px;white-space:pre-wrap;">${esc(r.testo)}</p>
          <p style="margin:0;">${bottone(`${APP_URL}/clienti/${cid}`, 'Apri la scheda cliente')}</p>`,
      }),
      text: `${c.nome} ha ${ok ? 'approvato' : 'rifiutato'} la stima (${ore(r.ore_stimate)}):\n\n${r.testo}`,
    },
    `decisione richiesta ${r.id}`
  );
}
