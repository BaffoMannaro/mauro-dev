import sql from '@/lib/db';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { parseFattura, type Fattura } from './parse';
import { renderFatturaHtml, nomeFilePdf } from './html';
import { normalizzaId, type PreventivoCollegabile } from './collegamenti';
import { trancheDaFatture, type IncassoFattura, type TrancheStato } from './tranche';
import {
  dataValida, inCentesimi, inEuro, oggiRoma, riepilogoPagamenti, validaPagamento, type Pagamento,
} from '@/lib/pagamenti';

export { normalizzaId };

/**
 * Pagamenti della fattura come JSON ([{ id, data, importo_cent, metodo, nota }], per data).
 * Va usato in query FROM fatture senza alias.
 */
export const pagamentiJson = () => sql`
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', pf.id, 'data', to_char(pf.data, 'YYYY-MM-DD'), 'importo_cent', pf.importo,
      'metodo', pf.metodo, 'nota', pf.nota
    ) ORDER BY pf.data, pf.id)
    FROM pagamenti_fattura pf WHERE pf.fattura_id = fatture.id
  ), '[]'::json)
`;

/** Incassato della fattura in euro (somma dei pagamenti). Query FROM fatture senza alias. */
const incassatoSql = () => sql`
  (COALESCE((SELECT sum(pf.importo) FROM pagamenti_fattura pf WHERE pf.fattura_id = fatture.id), 0) / 100.0)::float8
`;

/** Colonne dell'archivio che servono alla pagina Fatture (senza JOIN: i WHERE dei chiamanti restano non qualificati). */
export const archivioSelect = () => sql`
  SELECT id, numero, to_char(data, 'YYYY-MM-DD') AS data, anno, importo::float8 AS importo,
         imponibile::float8 AS imponibile, contributo::float8 AS contributo, stato,
         to_char(pagata_il, 'YYYY-MM-DD') AS pagata_il,
         cliente_id, cliente_nome, cliente_piva, con_logo, xml, preventivo_id, intestatario_id,
         (SELECT oggetto FROM preventivi p WHERE p.id = fatture.preventivo_id) AS preventivo_oggetto,
         ${incassatoSql()} AS incassato,
         GREATEST(0, COALESCE(importo, 0)::float8 - ${incassatoSql()}) AS residuo,
         ${pagamentiJson()} AS pagamenti
  FROM fatture
`;

/** Ordine delle fatture per anno e numero, più recente prima (come piuRecentePrima in ordine.ts). */
export const ordineFatture = () => sql`
  COALESCE(anno, extract(year FROM data)::int) DESC NULLS LAST,
  substring(numero FROM '[0-9]+')::int DESC NULLS LAST,
  id DESC
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

// ─── Pagamenti ────────────────────────────────────────────────

export class ErrorePagamento extends Error {}

export interface StatoPagamenti {
  fattura: { id: number; numero: string | null; cliente: string | null; data: string | null; preventivo_id: number | null };
  pagamenti: { id: number; data: string; importo: number; metodo: string | null; nota: string | null }[];
  totale: number;
  incassato: number;
  residuo: number;
  stato: 'da_pagare' | 'parziale' | 'pagata';
  pagata_il: string | null;
}

async function leggiFatturaPagamenti(fatturaId: number | string) {
  const [f] = await sql`
    SELECT id, numero, cliente_nome, to_char(data, 'YYYY-MM-DD') AS data, preventivo_id,
           importo::float8 AS importo, stato, to_char(pagata_il, 'YYYY-MM-DD') AS pagata_il,
           ${pagamentiJson()} AS pagamenti
    FROM fatture WHERE id = ${fatturaId}
  `;
  return f as
    | { id: number; numero: string | null; cliente_nome: string | null; data: string | null; preventivo_id: number | null;
        importo: number | null; stato: string; pagata_il: string | null; pagamenti: Required<Pagamento>[] }
    | undefined;
}

/** Pagamenti della fattura con incassato, residuo e stato (importi in euro). null se non esiste. */
export async function statoPagamenti(fatturaId: number | string): Promise<StatoPagamenti | null> {
  const f = await leggiFatturaPagamenti(fatturaId);
  if (!f) return null;
  const r = riepilogoPagamenti(f.importo, f.pagamenti);
  return {
    fattura: { id: f.id, numero: f.numero, cliente: f.cliente_nome, data: f.data, preventivo_id: f.preventivo_id },
    pagamenti: f.pagamenti.map((p) => ({ id: p.id, data: p.data, importo: inEuro(p.importo_cent), metodo: p.metodo, nota: p.nota })),
    ...r,
  };
}

/**
 * Riallinea stato e pagata_il della fattura ai suoi pagamenti (da_pagare / parziale / pagata)
 * e, se è collegata a un preventivo, le sue tranche.
 */
export async function ricalcolaStatoFattura(fatturaId: number | string) {
  const f = await leggiFatturaPagamenti(fatturaId);
  if (!f) return null;
  const r = riepilogoPagamenti(f.importo, f.pagamenti);
  if (r.stato !== f.stato || r.pagata_il !== f.pagata_il) {
    await sql`UPDATE fatture SET stato = ${r.stato}, pagata_il = ${r.pagata_il}::date, updated_at = NOW() WHERE id = ${f.id}`;
  }
  if (f.preventivo_id) await sincronizzaTranche(f.preventivo_id);
  return statoPagamenti(f.id);
}

/**
 * Registra un pagamento (importo in euro, data default oggi). Errore chiaro se l'importo
 * non è positivo, la data non è valida o la somma supera il totale della fattura.
 */
export async function registraPagamento(
  fatturaId: number | string,
  p: { importo: number; data?: string | null; metodo?: string | null; nota?: string | null }
): Promise<StatoPagamenti> {
  const f = await leggiFatturaPagamenti(fatturaId);
  if (!f) throw new ErrorePagamento(`Fattura ${fatturaId} non trovata`);
  const data = p.data || oggiRoma();
  const importoCent = inCentesimi(p.importo);
  const totaleCent = inCentesimi(f.importo);
  const incassatoCent = f.pagamenti.reduce((s, x) => s + x.importo_cent, 0);
  const err = Number(p.importo) > 0 && importoCent === 0
    ? 'L’importo del pagamento deve essere almeno 0,01 €.'
    : validaPagamento({ totaleCent, incassatoCent, importoCent, data });
  if (err) throw new ErrorePagamento(err);

  // Il controllo sulla somma si ripete nella INSERT, contro pagamenti arrivati nel frattempo.
  const righe = await sql`
    INSERT INTO pagamenti_fattura (fattura_id, data, importo, metodo, nota)
    SELECT ${f.id}, ${data}::date, ${importoCent}, ${p.metodo?.trim() || null}, ${p.nota?.trim() || null}
    WHERE ${importoCent} + COALESCE((SELECT sum(importo) FROM pagamenti_fattura WHERE fattura_id = ${f.id}), 0)
          <= round(${f.importo ?? 0}::numeric * 100)
    RETURNING id
  `;
  if (!righe.length) throw new ErrorePagamento('Il pagamento supera il residuo della fattura: ricarica i pagamenti e riprova.');
  return (await ricalcolaStatoFattura(f.id))!;
}

/** Elimina un pagamento e riallinea la fattura. null se il pagamento non esiste. */
export async function eliminaPagamento(pagamentoId: number | string, fatturaId?: number | string) {
  const [r] = fatturaId === undefined
    ? await sql`DELETE FROM pagamenti_fattura WHERE id = ${pagamentoId} RETURNING fattura_id`
    : await sql`DELETE FROM pagamenti_fattura WHERE id = ${pagamentoId} AND fattura_id = ${fatturaId} RETURNING fattura_id`;
  if (!r) return null;
  return ricalcolaStatoFattura(r.fattura_id);
}

/**
 * Compatibilità col vecchio "segna pagata / da pagare" (UI, aggiorna_stato_fattura):
 * - "pagata": registra un pagamento pari al residuo alla data indicata (default oggi). Se è già
 *   saldata con un solo pagamento e la data è diversa, corregge la data di quel pagamento.
 * - "da_pagare": elimina tutti i pagamenti della fattura.
 * null se la fattura non esiste.
 */
export async function impostaStatoFattura(id: number | string, stato: 'pagata' | 'da_pagare', pagataIl?: string | null) {
  const f = await leggiFatturaPagamenti(id);
  if (!f) return null;
  if (pagataIl && !dataValida(pagataIl)) throw new ErrorePagamento('Data del pagamento non valida: usa il formato YYYY-MM-DD.');

  if (stato === 'da_pagare') {
    await sql`DELETE FROM pagamenti_fattura WHERE fattura_id = ${f.id}`;
    return ricalcolaStatoFattura(f.id);
  }

  const giorno = pagataIl || oggiRoma();
  const r = riepilogoPagamenti(f.importo, f.pagamenti);
  if (r.residuo > 0) return registraPagamento(f.id, { importo: r.residuo, data: giorno, nota: 'Saldo' });
  if (r.totale <= 0) throw new ErrorePagamento('La fattura non ha un totale: impossibile registrare il saldo.');
  if (pagataIl && f.pagamenti.length === 1 && f.pagamenti[0].data !== pagataIl) {
    await sql`UPDATE pagamenti_fattura SET data = ${pagataIl}::date WHERE id = ${f.pagamenti[0].id}`;
  }
  return ricalcolaStatoFattura(f.id);
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
  // Tranche dei preventivi con fatture pagate collegate prima della spunta automatica.
  const conFatture = await sql`
    SELECT DISTINCT preventivo_id FROM fatture WHERE preventivo_id IS NOT NULL AND stato IN ('pagata', 'parziale')
  `;
  for (const r of conFatture) {
    try {
      await sincronizzaTranche(r.preventivo_id);
    } catch (e) {
      console.error(`Spunta tranche preventivo ${r.preventivo_id}:`, e);
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
  // Riletta con un totale diverso: lo stato dipende dai pagamenti già registrati.
  await ricalcolaStatoFattura(row.id);

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
  await sincronizzaTranche(preventivoId);
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

/**
 * Spunta le tranche del preventivo coperte dai pagamenti delle fatture collegate, in ordine:
 * una tranche è pagata quando i pagamenti (anche parziali) arrivano al suo totale cumulato,
 * con la data del pagamento che la completa. Le spunte messe così hanno
 * da_fattura: se la fattura torna "da pagare" o viene scollegata si tolgono; quelle
 * messe a mano non vengono mai toccate.
 */
export async function sincronizzaTranche(preventivoId: number) {
  const [p] = await sql`SELECT totale, tranches_stato, meta FROM preventivi WHERE id = ${preventivoId}`;
  if (!p) return;
  const totale = Number(p.totale) || 0;
  const prima = (p.tranches_stato ?? []) as TrancheStato[];
  const piano = (p.meta?.sezioni?.tranches ?? []) as { descrizione: string; percentuale: number }[];
  const base: TrancheStato[] = prima.length
    ? prima
    : piano.length
      ? piano.map((t) => ({ descrizione: t.descrizione, percentuale: Number(t.percentuale), pagato: false }))
      : [{ descrizione: 'Pagamento unico', percentuale: 100, pagato: false }];

  // Ogni pagamento (anche parziale) delle fatture collegate, alla sua data.
  const pagate = await sql`
    SELECT (pf.importo / 100.0)::float8 AS importo, to_char(pf.data, 'YYYY-MM-DD') AS giorno
    FROM pagamenti_fattura pf JOIN fatture f ON f.id = pf.fattura_id
    WHERE f.preventivo_id = ${preventivoId}
    ORDER BY pf.data, pf.id
  `;

  const tranche = trancheDaFatture(base, totale, pagate as IncassoFattura[]);

  const cambiato = JSON.stringify(tranche) !== JSON.stringify(prima.length ? prima : base);
  if (!cambiato || (!prima.length && !tranche.some((t) => t.pagato))) return;
  await sql`UPDATE preventivi SET tranches_stato = ${JSON.stringify(tranche)}::jsonb, updated_at = NOW() WHERE id = ${preventivoId}`;
}

/** Fatture collegate a un preventivo con il riepilogo fatturato / incassato. */
export async function fattureDelPreventivo(preventivoId: number) {
  const [p] = await sql`SELECT totale::float8 AS totale FROM preventivi WHERE id = ${preventivoId}`;
  if (!p) throw new Error(`Preventivo ${preventivoId} non trovato`);

  const fatture = await sql`
    SELECT f.id, f.numero, to_char(f.data, 'YYYY-MM-DD') AS data, f.importo::float8 AS importo, f.stato,
           (COALESCE((SELECT sum(pf.importo) FROM pagamenti_fattura pf WHERE pf.fattura_id = f.id), 0) / 100.0)::float8 AS incassato,
           f.xml IS NOT NULL AS da_xml, i.id AS intestatario_id,
           COALESCE(i.denominazione, f.cliente_nome) AS intestatario, i.piva
    FROM fatture f LEFT JOIN intestatari i ON i.id = f.intestatario_id
    WHERE f.preventivo_id = ${preventivoId}
    ORDER BY f.data NULLS LAST, f.id
  `;
  const cent = (n: number) => Math.round(n * 100) / 100;
  for (const f of fatture) f.residuo = cent(Math.max(0, (f.importo ?? 0) - f.incassato));
  const fatturato = cent(fatture.reduce((s, f) => s + (f.importo ?? 0), 0));
  // Incassato = pagamenti registrati sulle fatture (anche parziali).
  const incassato = cent(fatture.reduce((s, f) => s + f.incassato, 0));

  return {
    fatture,
    riepilogo: {
      totale_preventivo: p.totale,
      fatturato,
      incassato,
      da_fatturare: Math.max(0, cent(p.totale - fatturato)),
      da_incassare: Math.max(0, cent(fatturato - incassato)),
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
