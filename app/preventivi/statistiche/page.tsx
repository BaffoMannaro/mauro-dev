import sql from '@/lib/db';
import { preparaArchivio } from '@/lib/fattura/server';
import type { FatturaIncasso } from '@/lib/incassi';
import { leggiImpostazioniFisco } from '@/lib/fisco';
import { ensureClientiSchema } from '@/lib/schema';
import StatisticheDashboard from '@/components/StatisticheDashboard';

export const metadata = { title: 'Statistiche' };

export default async function StatistichePage() {
  const preventivi = await sql`SELECT * FROM preventivi ORDER BY created_at ASC`;
  // Anche gli abbonamenti chiusi con una data di fine: contano negli anni in cui erano attivi.
  const abbonamenti = await sql`SELECT * FROM abbonamenti WHERE attivo = true OR data_fine IS NOT NULL`;
  await preparaArchivio();
  await ensureClientiSchema(); // tabella impostazioni
  const fatture = await sql`
    SELECT preventivo_id, importo::float8 AS importo, to_char(data, 'YYYY-MM-DD') AS data,
           to_char(pagata_il, 'YYYY-MM-DD') AS pagata_il, stato
    FROM fatture
  `;
  const [fisco] = await sql`SELECT valore FROM impostazioni WHERE chiave = 'fisco'`;
  return (
    <StatisticheDashboard
      preventivi={preventivi as any}
      abbonamenti={abbonamenti as any}
      fatture={fatture as FatturaIncasso[]}
      fisco={leggiImpostazioniFisco(fisco?.valore)}
    />
  );
}
