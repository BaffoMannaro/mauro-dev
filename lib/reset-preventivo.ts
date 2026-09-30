import sql from './db';
import { ensureConfermaSchema } from './email-accettazione';
import { isScaduto, limitaScadenza } from './scadenza';
import { ensureTardivaSchema } from './tardiva';
import { ensureVisiteSchema } from './visite';

// Reset di un preventivo dal gestionale o da Claude:
//  - aperture: cancella lo storico delle aperture del link pubblico;
//  - accettazione: torna "inviato", cancella firma, IP, email di conferma e richiesta tardiva.
//    Se nel frattempo è scaduto, riparte con una nuova validità di 15 giorni da oggi.
// Non tocca fatture collegate né pagamenti delle tranches.

export interface EsitoReset {
  aperture_cancellate: number | null;
  accettazione_azzerata: boolean;
  nuova_scadenza: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preventivo: any;
}

export async function resetPreventivo(id: number, cosa: { aperture?: boolean; accettazione?: boolean }): Promise<EsitoReset> {
  if (!cosa.aperture && !cosa.accettazione) throw new Error('Indica cosa azzerare: aperture e/o accettazione');
  const [p] = await sql`SELECT * FROM preventivi WHERE id = ${id}`;
  if (!p) throw new Error(`Preventivo ${id} non trovato`);

  let aperture: number | null = null;
  if (cosa.aperture) {
    await ensureVisiteSchema();
    const rows = await sql`DELETE FROM preventivi_visite WHERE preventivo_id = ${id} RETURNING id`;
    aperture = rows.length;
  }

  let nuovaScadenza: string | null = null;
  if (cosa.accettazione) {
    await ensureConfermaSchema();
    await ensureTardivaSchema();
    nuovaScadenza = isScaduto(p) ? limitaScadenza(null) : null;
    await sql`
      UPDATE preventivi SET
        stato = 'inviato',
        accettato_at = NULL, accettato_ip = NULL, accettato_ua = NULL,
        accettato_nome = NULL, accettato_cognome = NULL, accettato_email = NULL,
        conferma_email_at = NULL, conferma_email_errore = NULL,
        richiesta_tardiva = NULL,
        scadenza = COALESCE(${nuovaScadenza}::date, scadenza),
        updated_at = NOW()
      WHERE id = ${id}
    `;
  }

  const [aggiornato] = await sql`SELECT * FROM preventivi WHERE id = ${id}`;
  return { aperture_cancellate: aperture, accettazione_azzerata: !!cosa.accettazione, nuova_scadenza: nuovaScadenza, preventivo: aggiornato };
}
