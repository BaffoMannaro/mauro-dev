// Listino interno: quanto quoto/fatturo ogni "azione" (tipo di lavoro), per fonte del cliente.
// Le osservazioni sono le voci dei preventivi e le righe delle fatture non collegate a un
// preventivo (quelle collegate sono già rappresentate dalle voci del preventivo).
// Funzioni pure qui sopra (usate anche nel browser); accesso al DB nel file listino-db.ts.

export interface Azione {
  id: number;
  nome: string;
  categoria: string | null;
  unita: string | null;
  note: string | null;
}

export interface Osservazione {
  chiave: string; // descrizione normalizzata: lega la voce a un'azione
  descrizione: string;
  origine: 'preventivo' | 'fattura';
  rif_id: number;
  rif: string;
  data: string; // YYYY-MM-DD
  cliente: string;
  cliente_id: number | null;
  fonte: string | null;
  quantita: number;
  prezzo: number; // unitario, come pagato dal cliente (rivalsa INPS inclusa)
  stato: string;
  svolto: boolean; // preventivo accettato/archiviato oppure fatturato
  azione_id: number | null;
}

/** "  Sviluppo Landing-Page. " → "sviluppo landing-page": chiave stabile per il raggruppamento. */
export const chiaveVoce = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s.,;:!-]+$/, '')
    .trim();

export interface Statistica {
  n: number;
  media: number;
  mediana: number;
  min: number;
  max: number;
  ultimo: { prezzo: number; data: string } | null;
}

export function statistica(prezzi: { prezzo: number; data: string }[]): Statistica | null {
  if (!prezzi.length) return null;
  const v = prezzi.map((p) => p.prezzo).sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  const ultimo = [...prezzi].sort((a, b) => b.data.localeCompare(a.data))[0];
  return {
    n: v.length,
    media: v.reduce((s, x) => s + x, 0) / v.length,
    mediana: v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2,
    min: v[0],
    max: v[v.length - 1],
    ultimo: { prezzo: ultimo.prezzo, data: ultimo.data },
  };
}

export interface RigaListino {
  azione: Azione;
  /** Chiave = id fonte, "nessuna" (cliente senza fonte) e "tutte". */
  per_fonte: Record<string, Statistica | null>;
}

export function calcolaListino(
  oss: Osservazione[],
  azioni: Azione[],
  { soloSvolti = true, fonti }: { soloSvolti?: boolean; fonti: string[] }
): RigaListino[] {
  const valide = oss.filter((o) => o.azione_id != null && o.prezzo > 0 && (!soloSvolti || o.svolto));
  return azioni
    .map((azione) => {
      const mie = valide.filter((o) => o.azione_id === azione.id);
      const per_fonte: Record<string, Statistica | null> = { tutte: statistica(mie) };
      for (const f of fonti) per_fonte[f] = statistica(mie.filter((o) => o.fonte === f));
      per_fonte.nessuna = statistica(mie.filter((o) => !o.fonte));
      return { azione, per_fonte };
    })
    .sort(
      (a, b) =>
        (a.azione.categoria ?? '~').localeCompare(b.azione.categoria ?? '~') || a.azione.nome.localeCompare(b.azione.nome)
    );
}

/** Voci non ancora assegnate a un'azione, raggruppate per descrizione. */
export function daClassificare(oss: Osservazione[]) {
  const gruppi = new Map<string, { chiave: string; descrizione: string; n: number; prezzi: number[]; clienti: Set<string> }>();
  for (const o of oss) {
    if (o.azione_id != null) continue;
    const g = gruppi.get(o.chiave) ?? { chiave: o.chiave, descrizione: o.descrizione, n: 0, prezzi: [], clienti: new Set() };
    g.n++;
    g.prezzi.push(o.prezzo);
    g.clienti.add(o.cliente);
    gruppi.set(o.chiave, g);
  }
  return [...gruppi.values()]
    .map((g) => ({ chiave: g.chiave, descrizione: g.descrizione, n: g.n, prezzi: g.prezzi, clienti: [...g.clienti] }))
    .sort((a, b) => b.n - a.n || a.descrizione.localeCompare(b.descrizione));
}
