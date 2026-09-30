// Invio email transazionali con Resend (integrazione Vercel Marketplace → RESEND_API_KEY).
// Il mittente deve appartenere a un dominio verificato su Resend (es. maurodev.it).

export const EMAIL_FROM = process.env.EMAIL_FROM || 'Mauro Altamura <preventivi@maurodev.it>';
export const EMAIL_MAURO = process.env.EMAIL_NOTIFICHE || 'altamura.mauro@gmail.com';

export interface Email {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function inviaEmail(e: Email): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY non configurata');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(e.to) ? e.to : [e.to],
      subject: e.subject,
      html: e.html,
      text: e.text,
      reply_to: e.replyTo,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Resend ${res.status}`);
  return { id: data.id };
}

// ─── Layout HTML (tabelle e stili inline: compatibile con Gmail/Outlook) ───

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function layoutEmail({ titolo, corpo, anteprima }: { titolo: string; corpo: string; anteprima: string }) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titolo)}</title></head>
<body style="margin:0;padding:0;background:#EAE9E2;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1B1C18;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(anteprima)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EAE9E2;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBFBF7;border-radius:14px;overflow:hidden;border:1px solid #D3D2C7;">
    <tr><td style="background:#17181A;padding:20px 28px;border-bottom:3px solid #DCF23C;">
      <span style="color:#F4F5EF;font-size:15px;font-weight:700;letter-spacing:.18em;">MAURO DEV</span>
    </td></tr>
    <tr><td style="padding:28px 28px 8px;font-size:15px;line-height:1.6;">${corpo}</td></tr>
    <tr><td style="padding:20px 28px 26px;border-top:1px solid #E2E1D7;font-size:12px;line-height:1.6;color:#8B8B80;">
      Mauro Altamura · Sviluppatore web · <a href="https://maurodev.it" style="color:#8B8B80;">maurodev.it</a><br>
      P.IVA IT08250840728 · <a href="mailto:altamura.mauro@gmail.com" style="color:#8B8B80;">altamura.mauro@gmail.com</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

export const bottone = (href: string, testo: string, primario = true) =>
  `<a href="${esc(href)}" style="display:inline-block;padding:12px 20px;margin:4px 8px 4px 0;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;${
    primario ? 'background:#DCF23C;color:#1B1D12;' : 'background:#E2E1D7;color:#1B1C18;'
  }">${esc(testo)}</a>`;
