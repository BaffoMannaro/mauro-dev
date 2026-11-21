import sql from '@/lib/db';
import { ensureScacchiSchema } from './db';
import { FINALI } from './finali';

// Progressi sui finali: completato, minimo di mosse, tentativi.

let ensured = false;

async function ensure() {
  await ensureScacchiSchema();
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS scacchi_finali (
      finale_id TEXT PRIMARY KEY,
      completato BOOLEAN NOT NULL DEFAULT false,
      migliori INTEGER,
      tentativi INTEGER NOT NULL DEFAULT 0,
      ultimo TIMESTAMPTZ
    )
  `;
  ensured = true;
}

export type ProgressoFinale = { finale_id: string; completato: boolean; migliori: number | null; tentativi: number; ultimo: string | null };

export async function progressiFinali(): Promise<Record<string, ProgressoFinale>> {
  await ensure();
  const rows = (await sql`SELECT * FROM scacchi_finali`) as ProgressoFinale[];
  return Object.fromEntries(rows.map((r) => [r.finale_id, r]));
}

export async function registraFinale(id: string, riuscito: boolean, mosse: number) {
  if (!FINALI.some((f) => f.id === id)) throw new Error('Finale sconosciuto');
  await ensure();
  const migliori = riuscito ? mosse : null;
  await sql`
    INSERT INTO scacchi_finali (finale_id, completato, migliori, tentativi, ultimo)
    VALUES (${id}, ${riuscito}, ${migliori}, 1, NOW())
    ON CONFLICT (finale_id) DO UPDATE SET
      completato = scacchi_finali.completato OR EXCLUDED.completato,
      migliori = CASE WHEN EXCLUDED.migliori IS NULL THEN scacchi_finali.migliori
                      ELSE LEAST(COALESCE(scacchi_finali.migliori, EXCLUDED.migliori), EXCLUDED.migliori) END,
      tentativi = scacchi_finali.tentativi + 1, ultimo = NOW()
  `;
}
