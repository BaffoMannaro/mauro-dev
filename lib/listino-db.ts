import sql from './db';
import { parseFattura } from './fattura/parse';
import { preparaArchivio } from './fattura/server';
import { chiaveVoce, type Azione, type Osservazione } from './listino';

let ensured = false;

export async function ensureListinoSchema() {
  await preparaArchivio(); // fatture, intestatari, clienti.fonte
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS azioni (
      id SERIAL PRIMARY KEY,
      nome TEXT UNIQUE NOT NULL,
      categoria TEXT,
      unita TEXT,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Descrizione normalizzata → azione: una volta classificata, la stessa voce resta classificata.
  await sql`
    CREATE TABLE IF NOT EXISTS voci_azioni (
      chiave TEXT PRIMARY KEY,
      azione_id INTEGER NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  ensured = true;
}

export async function leggiAzioni(): Promise<Azione[]> {
  return (await sql`SELECT id, nome, categoria, unita, note FROM azioni ORDER BY categoria NULLS LAST, nome`) as Azione[];
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '').slice(0, 10));

/** Tutte le voci di lavoro: preventivi (voci + canone di manutenzione) e fatture non collegate a preventivi. */
export async function raccogliOsservazioni(): Promise<Osservazione[]> {
  await ensureListinoSchema();
  const mappa = new Map<string, number>(
    (await sql`SELECT chiave, azione_id FROM voci_azioni`).map((r) => [r.chiave as string, r.azione_id as number])
  );
  const out: Osservazione[] = [];
  const push = (o: Omit<Osservazione, 'chiave' | 'azione_id'>) => {
    const chiave = chiaveVoce(o.descrizione);
    if (chiave) out.push({ ...o, chiave, azione_id: mappa.get(chiave) ?? null });
  };

  const preventivi = await sql`
    SELECT p.id, p.oggetto, p.stato, p.voci, p.created_at, p.cliente_id,
           p.meta->'sezioni'->'manutenzione' AS manutenzione,
           COALESCE(c.nome, p.cliente_azienda, p.cliente_nome) AS cliente, c.fonte
    FROM preventivi p LEFT JOIN clienti c ON c.id = p.cliente_id
  `;
  for (const p of preventivi) {
    const base = {
      origine: 'preventivo' as const,
      rif_id: p.id,
      rif: p.oggetto,
      data: iso(p.created_at),
      cliente: p.cliente,
      cliente_id: p.cliente_id,
      fonte: p.fonte,
      stato: p.stato,
      svolto: p.stato === 'accettato' || p.stato === 'archiviato',
    };
    for (const v of (p.voci ?? []) as { descrizione?: string | null; quantita?: number; prezzo?: number }[]) {
      push({
        ...base,
        // I preventivi più vecchi hanno un'unica voce senza descrizione: vale l'oggetto.
        descrizione: (v.descrizione || p.oggetto || '').trim(),
        quantita: Number(v.quantita) || 1,
        prezzo: Number(v.prezzo) || 0,
      });
    }
    const man = p.manutenzione as { prezzo?: number } | null;
    if (man && Number(man.prezzo) > 0) {
      push({ ...base, descrizione: 'Manutenzione mensile (canone)', quantita: 1, prezzo: Number(man.prezzo) });
    }
  }

  const fatture = await sql`
    SELECT f.id, f.numero, f.xml, f.stato, to_char(f.data, 'YYYY-MM-DD') AS data,
           COALESCE(f.cliente_id, i.cliente_id) AS cliente_id,
           COALESCE(c.nome, f.cliente_nome) AS cliente, c.fonte
    FROM fatture f
    LEFT JOIN intestatari i ON i.id = f.intestatario_id
    LEFT JOIN clienti c ON c.id = COALESCE(f.cliente_id, i.cliente_id)
    WHERE f.xml IS NOT NULL AND f.preventivo_id IS NULL
  `;
  for (const f of fatture) {
    let fattura;
    try {
      fattura = parseFattura(f.xml);
    } catch {
      continue;
    }
    // Prezzo come pagato dal cliente: riparto il totale documento (rivalsa INPS inclusa) sulle righe.
    const imponibile = fattura.linee.reduce((s, l) => s + l.prezzoTotale, 0);
    const fattore = imponibile > 0 ? fattura.totaleDocumento / imponibile : 1;
    for (const l of fattura.linee) {
      push({
        origine: 'fattura',
        rif_id: f.id,
        rif: `Fattura n. ${f.numero}`,
        data: f.data,
        cliente: f.cliente,
        cliente_id: f.cliente_id,
        fonte: f.fonte,
        stato: f.stato,
        svolto: true,
        descrizione: l.descrizione,
        quantita: l.quantita ?? 1,
        prezzo: Math.round(l.prezzoUnitario * fattore * 100) / 100,
      });
    }
  }

  return out.sort((a, b) => b.data.localeCompare(a.data));
}

// ─── Gestione azioni ──────────────────────────────────────────

export async function creaAzione(a: { nome: string; categoria?: string | null; unita?: string | null; note?: string | null }) {
  await ensureListinoSchema();
  const nome = a.nome.trim();
  if (!nome) throw new Error('Il nome dell’azione è obbligatorio');
  const [row] = await sql`
    INSERT INTO azioni (nome, categoria, unita, note)
    VALUES (${nome}, ${a.categoria || null}, ${a.unita || null}, ${a.note || null})
    ON CONFLICT (nome) DO UPDATE SET
      categoria = COALESCE(EXCLUDED.categoria, azioni.categoria),
      unita = COALESCE(EXCLUDED.unita, azioni.unita),
      note = COALESCE(EXCLUDED.note, azioni.note),
      updated_at = NOW()
    RETURNING id, nome, categoria, unita, note
  `;
  return row as Azione;
}

export async function modificaAzione(
  id: number,
  a: { nome?: string; categoria?: string | null; unita?: string | null; note?: string | null; unisci_in?: number }
) {
  await ensureListinoSchema();
  if (a.unisci_in) {
    // Sposta tutte le voci nell'altra azione ed elimina questa.
    await sql`UPDATE voci_azioni SET azione_id = ${a.unisci_in}, updated_at = NOW() WHERE azione_id = ${id}`;
    await sql`DELETE FROM azioni WHERE id = ${id}`;
    return null;
  }
  const [row] = await sql`
    UPDATE azioni SET
      nome = COALESCE(${a.nome?.trim() || null}, nome),
      categoria = CASE WHEN ${a.categoria === undefined}::boolean THEN categoria ELSE ${a.categoria || null}::text END,
      unita = CASE WHEN ${a.unita === undefined}::boolean THEN unita ELSE ${a.unita || null}::text END,
      note = CASE WHEN ${a.note === undefined}::boolean THEN note ELSE ${a.note || null}::text END,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, nome, categoria, unita, note
  `;
  if (!row) throw new Error(`Azione ${id} non trovata`);
  return row as Azione;
}

/** Elimina l'azione: le sue voci tornano "da classificare" (nessun dato di lavoro viene toccato). */
export async function eliminaAzione(id: number) {
  await ensureListinoSchema();
  await sql`DELETE FROM voci_azioni WHERE azione_id = ${id}`;
  await sql`DELETE FROM azioni WHERE id = ${id}`;
}

/** Assegna le voci (per descrizione) a un'azione, oppure le declassifica con azioneId null. */
export async function classificaVoci(descrizioni: string[], azioneId: number | null) {
  await ensureListinoSchema();
  const chiavi = [...new Set(descrizioni.map(chiaveVoce).filter(Boolean))];
  if (azioneId == null) {
    for (const k of chiavi) await sql`DELETE FROM voci_azioni WHERE chiave = ${k}`;
    return chiavi.length;
  }
  const [a] = await sql`SELECT id FROM azioni WHERE id = ${azioneId}`;
  if (!a) throw new Error(`Azione ${azioneId} non trovata`);
  for (const k of chiavi) {
    await sql`
      INSERT INTO voci_azioni (chiave, azione_id) VALUES (${k}, ${azioneId})
      ON CONFLICT (chiave) DO UPDATE SET azione_id = EXCLUDED.azione_id, updated_at = NOW()
    `;
  }
  return chiavi.length;
}
