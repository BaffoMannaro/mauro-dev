import sql from '@/lib/db';
import { ensureScacchiSchema } from './db';

// Registro degli allenamenti (puzzle, finali) con data: serve a contare i compiti fatti durante una missione.

let ensured = false;

async function ensure() {
  await ensureScacchiSchema();
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS scacchi_allenamento_log (
      id SERIAL PRIMARY KEY,
      tipo TEXT NOT NULL,
      rif TEXT NOT NULL,
      esito BOOLEAN NOT NULL,
      quando TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  ensured = true;
}

export async function registraAllenamento(tipo: 'puzzle' | 'finale', rif: string, esito: boolean) {
  await ensure();
  await sql`INSERT INTO scacchi_allenamento_log (tipo, rif, esito) VALUES (${tipo}, ${rif}, ${esito})`;
}

/** Puzzle risolti e finali completati da una certa data. */
export async function allenamentiDal(inizio: string, fine: string | null) {
  await ensure();
  const righe = (await sql`
    SELECT tipo, rif, esito FROM scacchi_allenamento_log
    WHERE quando >= ${inizio} AND (${fine}::timestamptz IS NULL OR quando <= ${fine})
  `) as { tipo: string; rif: string; esito: boolean }[];
  return {
    puzzleRisolti: righe.filter((r) => r.tipo === 'puzzle' && r.esito).length,
    finaliCompletati: [...new Set(righe.filter((r) => r.tipo === 'finale' && r.esito).map((r) => r.rif))],
  };
}
