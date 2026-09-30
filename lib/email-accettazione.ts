import sql from './db';
import { bottone, EMAIL_MAURO, esc, inviaEmail, layoutEmail } from './email';

// Email inviate automaticamente quando un preventivo viene accettato (pagina pubblica o portale):
// conferma al cliente con il riepilogo, notifica a Mauro con i dati dell'accettazione.

const SITE_URL =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://maurodev.it');
const APP_URL = process.env.APP_HOST ? `https://${process.env.APP_HOST}` : 'https://app.maurodev.it';

const euro = (n: number) => `€ ${n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
const quando = (d: Date) =>
  d.toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export async function ensureConfermaSchema() {
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS conferma_email_at TIMESTAMPTZ`;
  await sql`ALTER TABLE preventivi ADD COLUMN IF NOT EXISTS conferma_email_errore TEXT`;
}

/** Invia conferma al cliente e notifica a Mauro. Non lancia: registra l'esito sul preventivo. */
export async function inviaEmailAccettazione(preventivoId: number) {
  await ensureConfermaSchema();
  const [p] = await sql`SELECT * FROM preventivi WHERE id = ${preventivoId}`;
  if (!p) return;

  const totale = Number(p.totale);
  const accettatoIl = quando(new Date(p.accettato_at ?? Date.now()));
  const firmatario = [p.accettato_nome, p.accettato_cognome].filter(Boolean).join(' ') || p.cliente_nome;
  const emailCliente: string | null = p.accettato_email || p.cliente_email || null;
  const link = `${SITE_URL}/p/${p.token}`;
  const tranches: { descrizione: string; percentuale: number }[] = p.tranches_stato?.length
    ? p.tranches_stato
    : p.meta?.sezioni?.tranches ?? [];

  const righeTranches = tranches
    .map(
      (t) => `<tr>
        <td style="padding:6px 0;color:#4C4D45;">${esc(t.descrizione)}</td>
        <td style="padding:6px 0;text-align:right;font-weight:600;white-space:nowrap;">${euro(Math.round((totale * t.percentuale) / 100))}</td>
      </tr>`
    )
    .join('');

  const htmlCliente = layoutEmail({
    titolo: 'Preventivo accettato',
    anteprima: `Ho ricevuto la tua accettazione di "${p.oggetto}". Ecco il riepilogo.`,
    corpo: `
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;">Grazie, ${esc(String(p.accettato_nome || firmatario).split(' ')[0])}!</p>
      <p style="margin:0 0 16px;">Ho ricevuto l’accettazione del preventivo <strong>${esc(p.oggetto)}</strong>. Ti ricontatterò a breve per organizzare l’avvio del lavoro.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;background:#F1F0EA;border-radius:10px;padding:16px 18px;">
        <tr><td style="padding:0 0 10px;color:#8B8B80;font-size:12px;letter-spacing:.08em;text-transform:uppercase;">Riepilogo</td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
            <tr><td style="padding:6px 0;color:#4C4D45;">Compenso totale</td>
                <td style="padding:6px 0;text-align:right;font-weight:700;font-size:16px;">${euro(totale)}</td></tr>
            <tr><td style="padding:6px 0;color:#4C4D45;">IVA</td>
                <td style="padding:6px 0;text-align:right;">${p.iva ? 'Inclusa' : 'Esente (regime forfettario)'}</td></tr>
            ${righeTranches ? `<tr><td colspan="2" style="padding:10px 0 2px;color:#8B8B80;font-size:12px;">Piano di pagamento</td></tr>${righeTranches}` : ''}
          </table>
        </td></tr>
      </table>
      <p style="margin:0 0 20px;">${bottone(link, 'Vedi il preventivo')}${bottone(`${SITE_URL}/api/p/${p.token}/pdf`, 'Scarica il PDF', false)}</p>
      <p style="margin:0;font-size:13px;color:#8B8B80;">Accettazione registrata a nome di ${esc(firmatario)}${emailCliente ? ` (${esc(emailCliente)})` : ''} il ${accettatoIl}. Per qualsiasi domanda rispondi pure a questa email.</p>`,
  });
  const testoCliente =
    `Grazie! Ho ricevuto l'accettazione del preventivo "${p.oggetto}".\n\n` +
    `Compenso totale: ${euro(totale)} (${p.iva ? 'IVA inclusa' : 'esente IVA, regime forfettario'})\n` +
    tranches.map((t) => `- ${t.descrizione}: ${euro(Math.round((totale * t.percentuale) / 100))}`).join('\n') +
    `\n\nPreventivo: ${link}\nAccettazione registrata a nome di ${firmatario} il ${accettatoIl}.\n\nMauro Altamura · maurodev.it`;

  const htmlMauro = layoutEmail({
    titolo: 'Preventivo accettato',
    anteprima: `${firmatario} ha accettato ${p.oggetto} (${euro(totale)})`,
    corpo: `
      <p style="margin:0 0 12px;font-size:18px;font-weight:700;">✓ Preventivo accettato</p>
      <p style="margin:0 0 16px;"><strong>${esc(p.cliente_azienda || p.cliente_nome)}</strong> ha accettato <strong>${esc(p.oggetto)}</strong> — ${euro(totale)}.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4C4D45;margin:0 0 20px;">
        <tr><td style="padding:3px 16px 3px 0;color:#8B8B80;">Firmato da</td><td>${esc(firmatario)}</td></tr>
        <tr><td style="padding:3px 16px 3px 0;color:#8B8B80;">Email</td><td>${esc(emailCliente ?? '—')}</td></tr>
        <tr><td style="padding:3px 16px 3px 0;color:#8B8B80;">Quando</td><td>${accettatoIl}</td></tr>
        <tr><td style="padding:3px 16px 3px 0;color:#8B8B80;">IP</td><td>${esc(p.accettato_ip ?? '—')}</td></tr>
      </table>
      <p style="margin:0;">${bottone(APP_URL, 'Apri il gestionale')}${bottone(link, 'Preventivo pubblico', false)}</p>`,
  });

  const errori: string[] = [];
  if (emailCliente) {
    try {
      await inviaEmail({
        to: emailCliente,
        subject: `Preventivo accettato — ${p.oggetto}`,
        html: htmlCliente,
        text: testoCliente,
        replyTo: EMAIL_MAURO,
      });
    } catch (e) {
      errori.push(`cliente: ${(e as Error).message}`);
    }
  } else {
    errori.push('cliente: nessuna email');
  }
  try {
    await inviaEmail({
      to: EMAIL_MAURO,
      subject: `✓ ${p.cliente_azienda || p.cliente_nome} ha accettato: ${p.oggetto} (${euro(totale)})`,
      html: htmlMauro,
      text: `${firmatario} ha accettato "${p.oggetto}" (${euro(totale)}) il ${accettatoIl}.\n${APP_URL}`,
      replyTo: emailCliente ?? undefined,
    });
  } catch (e) {
    errori.push(`notifica: ${(e as Error).message}`);
  }

  if (errori.length) console.error(`[email] preventivo ${preventivoId}:`, errori.join(' | '));
  await sql`
    UPDATE preventivi SET
      conferma_email_at = ${errori.some((e) => e.startsWith('cliente')) ? null : new Date().toISOString()},
      conferma_email_errore = ${errori.length ? errori.join(' | ') : null}
    WHERE id = ${preventivoId}
  `;
}
