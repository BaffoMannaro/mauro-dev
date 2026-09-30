import sql from '@/lib/db';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { parseFattura, type Fattura } from './parse';
import { renderFatturaHtml, nomeFilePdf } from './html';
import { normalizzaId, type PreventivoCollegabile } from './collegamenti';

export { normalizzaId };

/** Colonne dell'archivio che servono alla pagina Fatture (senza JOIN: i WHERE dei chiamanti restano non qualificati). */
export const archivioSelect = () => sql`
  SELECT id, numero, to_char(data, 'YYYY-MM-DD') AS data, anno, importo::float8 AS importo,
         imponibile::float8 AS imponibile, contributo::float8 AS contributo, stato,
         cliente_id, cliente_nome, cliente_piva, con_logo, xml, preventivo_id, intestatario_id,
         (SELECT oggetto FROM preventivi p WHERE p.id = fatture.preventivo_id) AS preventivo_oggetto
  FROM fatture
`;

/** Genera il PDF brandizzato con PDFShift e lo restituisce come download. */
export async function rispostaPdf(f: Fattura, logo: boolean): Promise<Response> {
  const pdfRes = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source: renderFatturaHtml(f, { logo }), format: 'A4', margin: '0' }),
  });

  if (!pdfRes.ok) {
    console.error('PDFShift error:', await pdfRes.text());
    return Response.json({ error: 'Generazione PDF non riuscita' }, { status: 500 });
  }

  return new Response(await pdfRes.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeFilePdf(f)}"`,
    },
  });
}

// ─── Intestatari (società / dati fiscali) ─────────────────────

/**
 * Crea o aggiorna la società intestataria della fattura. La fattura più recente è la
 * fonte di verità: i dati vengono sovrascritti solo da fatture con data uguale o successiva.
 */
export async function upsertIntestatario(f: Fattura): Promise<{ id: number; cliente_id: number | null }> {
  const c = f.committente;
  const chiave =
    normalizzaId(c.piva) || (c.cf ? `CF:${normalizzaId(c.cf)}` : `NOME:${c.nome.toUpperCase().replace(/\s+/g, ' ')}`);

  await sql`
    INSERT INTO intestatari (
      chiave, denominazione, piva, codice_fiscale, indirizzo, localita, codice_destinatario, pec, dati_al
    ) VALUES (
      ${chiave}, ${c.nome}, ${c.piva}, ${c.cf}, ${c.indirizzo || null}, ${c.localita || null},
      ${f.codiceDestinatario}, ${f.pecDestinatario}, ${f.data}
    )
    ON CONFLICT (chiave) DO UPDATE SET
      denominazione = EXCLUDED.denominazione, piva = EXCLUDED.piva, codice_fiscale = EXCLUDED.codice_fiscale,
      indirizzo = EXCLUDED.indirizzo, localita = EXCLUDED.localita,
      codice_destinatario = COALESCE(EXCLUDED.codice_destinatario, intestatari.codice_destinatario),
      pec = COALESCE(EXCLUDED.pec, intestatari.pec),
      dati_al = EXCLUDED.dati_al, updated_at = NOW()
    WHERE intestatari.dati_al IS NULL OR EXCLUDED.dati_al >= intestatari.dati_al
  `;
  const [row] = await sql`SELECT id, cliente_id FROM intestatari WHERE chiave = ${chiave}`;
  return row as { id: number; cliente_id: number | null };
}

let backfillFatto = false;

/** Schema + collegamento delle fatture già in archivio alle rispettive società (una volta per istanza). */
export async function preparaArchivio() {
  await ensureFattureXmlSchema();
  if (backfillFatto) return;
  const orfane = await sql`
    SELECT id, xml FROM fatture WHERE xml IS NOT NULL AND intestatario_id IS NULL ORDER BY data, id
  `;
  for (const r of orfane) {
    try {
      const i = await upsertIntestatario(parseFattura(r.xml));
      await sql`UPDATE fatture SET intestatario_id = ${i.id} WHERE id = ${r.id}`;
      await sql`
        UPDATE intestatari SET cliente_id = f.cliente_id
        FROM fatture f WHERE f.id = ${r.id} AND intestatari.id = ${i.id}
          AND intestatari.cliente_id IS NULL AND f.cliente_id IS NOT NULL
      `;
    } catch (e) {
      console.error(`Backfill intestatario fattura ${r.id}:`, e);
    }
  }
  backfillFatto = true;
}

// ─── Salvataggio ──────────────────────────────────────────────

/**
 * Salva (o aggiorna, se numero+anno esistono già) una fattura XML nell'archivio.
 * Crea/aggiorna la società intestataria e collega il cliente: prima quello già associato
 * alla società, poi per P.IVA o codice fiscale in anagrafica clienti.
 */
export async function salvaFattura(f: Fattura, xml: string, conLogo: boolean, preventivoId?: number | null) {
  const intestatario = await upsertIntestatario(f);

  let clienteId = intestatario.cliente_id;
  if (clienteId == null) {
    const piva = normalizzaId(f.committente.piva);
    const cf = normalizzaId(f.committente.cf);
    const [cliente] = await sql`
      SELECT id FROM clienti
      WHERE (${piva} <> '' AND regexp_replace(regexp_replace(upper(coalesce(piva, '')), '[^A-Z0-9]', '', 'g'), '^IT(?=[0-9]{11}$)', '') = ${piva})
         OR (${cf} <> '' AND upper(coalesce(codice_fiscale, '')) = ${cf})
      ORDER BY id LIMIT 1
    `;
    clienteId = cliente?.id ?? null;
    if (clienteId != null) {
      await sql`UPDATE intestatari SET cliente_id = ${clienteId} WHERE id = ${intestatario.id} AND cliente_id IS NULL`;
    }
  }

  const anno = Number(f.data.slice(0, 4));
  const imponibile = f.linee.reduce((s, l) => s + l.prezzoTotale, 0);
  const contributo = f.casse.reduce((s, c) => s + c.importo, 0);

  const [row] = await sql`
    INSERT INTO fatture (
      cliente_id, numero, importo, data, anno, xml, cliente_nome, cliente_piva,
      imponibile, contributo, con_logo, intestatario_id
    ) VALUES (
      ${clienteId}, ${f.numero}, ${f.totaleDocumento}, ${f.data}, ${anno}, ${xml},
      ${f.committente.nome}, ${f.committente.piva}, ${imponibile}, ${contributo}, ${conLogo}, ${intestatario.id}
    )
    ON CONFLICT (numero, anno) WHERE xml IS NOT NULL DO UPDATE SET
      cliente_id = COALESCE(fatture.cliente_id, EXCLUDED.cliente_id),
      importo = EXCLUDED.importo, data = EXCLUDED.data, xml = EXCLUDED.xml,
      cliente_nome = EXCLUDED.cliente_nome, cliente_piva = EXCLUDED.cliente_piva,
      imponibile = EXCLUDED.imponibile, contributo = EXCLUDED.contributo,
      con_logo = EXCLUDED.con_logo, intestatario_id = EXCLUDED.intestatario_id, updated_at = NOW()
    RETURNING id, preventivo_id
  `;
  // Il PDF è sempre rigenerato dall'XML: il link vale per admin e portale cliente.
  await sql`UPDATE fatture SET pdf_url = ${`/api/fatture/${row.id}/pdf`} WHERE id = ${row.id}`;

  if (preventivoId !== undefined) {
    await collegaPreventivo(row.id, preventivoId);
  } else if (row.preventivo_id) {
    // Riletta una fattura già collegata: i dati della società potrebbero essere cambiati.
    await sincronizzaPreventivo(row.preventivo_id);
  }

  const [salvata] = await sql`${archivioSelect()} WHERE id = ${row.id}`;
  return salvata;
}

// ─── Collegamento fattura ↔ preventivo ────────────────────────

/**
 * Collega (o scollega, con null) una fattura a un preventivo. Un preventivo può avere più
 * fatture, anche intestate a società diverse. Propaga il cliente dove manca e aggiorna il
 * preventivo con le società delle fatture, che sono la fonte di verità.
 */
export async function collegaPreventivo(fatturaId: number, preventivoId: number | null) {
  const [f] = await sql`SELECT id, preventivo_id, cliente_id, intestatario_id FROM fatture WHERE id = ${fatturaId}`;
  if (!f) throw new Error(`Fattura ${fatturaId} non trovata`);

  if (preventivoId != null) {
    const [p] = await sql`SELECT id, cliente_id FROM preventivi WHERE id = ${preventivoId}`;
    if (!p) throw new Error(`Preventivo ${preventivoId} non trovato`);

    await sql`
      UPDATE fatture SET preventivo_id = ${preventivoId}, cliente_id = COALESCE(cliente_id, ${p.cliente_id}), updated_at = NOW()
      WHERE id = ${fatturaId}
    `;
    // Un preventivo fatturato è stato di fatto accettato.
    await sql`
      UPDATE preventivi SET
        cliente_id = COALESCE(cliente_id, ${f.cliente_id}),
        stato = CASE WHEN stato = 'inviato' THEN 'accettato' ELSE stato END,
        updated_at = NOW()
      WHERE id = ${preventivoId}
    `;
    const clienteId = p.cliente_id ?? f.cliente_id;
    if (clienteId != null && f.intestatario_id != null) {
      await sql`UPDATE intestatari SET cliente_id = ${clienteId} WHERE id = ${f.intestatario_id} AND cliente_id IS NULL`;
    }
    await sincronizzaPreventivo(preventivoId);
  } else {
    await sql`UPDATE fatture SET preventivo_id = NULL, updated_at = NOW() WHERE id = ${fatturaId}`;
  }

  if (f.preventivo_id && f.preventivo_id !== preventivoId) await sincronizzaPreventivo(f.preventivo_id);
}

/** Aggiorna società e P.IVA del preventivo con quelle delle fatture collegate. */
export async function sincronizzaPreventivo(preventivoId: number) {
  const intestatari = await sql`
    SELECT i.id, i.denominazione, i.piva, i.codice_fiscale, i.indirizzo, i.localita,
           i.codice_destinatario, i.pec, min(f.data) AS prima, sum(f.importo)::float8 AS fatturato
    FROM fatture f JOIN intestatari i ON i.id = f.intestatario_id
    WHERE f.preventivo_id = ${preventivoId}
    GROUP BY i.id ORDER BY prima, i.id
  `;
  const [p] = await sql`SELECT meta FROM preventivi WHERE id = ${preventivoId}`;
  if (!p) return;
  const meta = { ...(p.meta ?? {}) };

  if (intestatari.length === 0) {
    // Nessuna fattura collegata: resta l'ultima società nota, tolgo solo l'elenco.
    delete meta.intestatari;
    await sql`UPDATE preventivi SET meta = ${JSON.stringify(meta)}, updated_at = NOW() WHERE id = ${preventivoId}`;
    return;
  }

  const azienda = intestatari.map((i) => i.denominazione).join(' · ');
  const piva = intestatari.map((i) => i.piva || i.codice_fiscale).filter(Boolean).join(' · ') || undefined;
  meta.cliente = { ...(meta.cliente ?? {}), azienda, piva };
  meta.intestatari = intestatari.map((i) => ({
    id: i.id,
    denominazione: i.denominazione,
    piva: i.piva,
    codice_fiscale: i.codice_fiscale,
    indirizzo: i.indirizzo,
    localita: i.localita,
    codice_destinatario: i.codice_destinatario,
    pec: i.pec,
    fatturato: i.fatturato,
  }));

  await sql`
    UPDATE preventivi SET cliente_azienda = ${azienda}, meta = ${JSON.stringify(meta)}, updated_at = NOW()
    WHERE id = ${preventivoId}
  `;
}

/** Fatture collegate a un preventivo con il riepilogo fatturato / incassato. */
export async function fattureDelPreventivo(preventivoId: number) {
  const [p] = await sql`SELECT totale::float8 AS totale FROM preventivi WHERE id = ${preventivoId}`;
  if (!p) throw new Error(`Preventivo ${preventivoId} non trovato`);

  const fatture = await sql`
    SELECT f.id, f.numero, to_char(f.data, 'YYYY-MM-DD') AS data, f.importo::float8 AS importo, f.stato,
           f.xml IS NOT NULL AS da_xml, i.id AS intestatario_id,
           COALESCE(i.denominazione, f.cliente_nome) AS intestatario, i.piva
    FROM fatture f LEFT JOIN intestatari i ON i.id = f.intestatario_id
    WHERE f.preventivo_id = ${preventivoId}
    ORDER BY f.data NULLS LAST, f.id
  `;
  const fatturato = fatture.reduce((s, f) => s + (f.importo ?? 0), 0);
  const incassato = fatture.filter((f) => f.stato === 'pagata').reduce((s, f) => s + (f.importo ?? 0), 0);

  return {
    fatture,
    riepilogo: {
      totale_preventivo: p.totale,
      fatturato,
      incassato,
      da_fatturare: Math.max(0, p.totale - fatturato),
      da_incassare: fatturato - incassato,
      societa: [...new Set(fatture.map((f) => f.intestatario).filter(Boolean))],
    },
  };
}

/** Preventivi con quanto già fatturato, per suggerire e scegliere il collegamento. */
export async function preventiviCollegabili(): Promise<PreventivoCollegabile[]> {
  return (await sql`
    SELECT p.id, p.oggetto, p.cliente_nome, p.cliente_azienda, p.cliente_id,
           p.meta->'cliente'->>'piva' AS piva, p.totale::float8 AS totale, p.stato,
           to_char(p.created_at, 'YYYY-MM-DD') AS creato_il,
           COALESCE((SELECT sum(f.importo) FROM fatture f WHERE f.preventivo_id = p.id), 0)::float8 AS fatturato
    FROM preventivi p
    ORDER BY p.created_at DESC
  `) as PreventivoCollegabile[];
}
