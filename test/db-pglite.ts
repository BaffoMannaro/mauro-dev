// Database di test: Postgres vero in memoria (PGlite) dietro la stessa interfaccia del driver
// Neon usato in lib/db.ts (template SQL con frammenti annidati, risultato = array di righe).
import { PGlite } from '@electric-sql/pglite';

type Riga = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

class Query implements PromiseLike<Riga[]> {
  constructor(private db: PGlite, readonly strings: readonly string[], readonly values: unknown[]) {}

  /** Testo con $1, $2…: i frammenti sql`…` annidati si inseriscono, il resto diventa parametro. */
  build(params: unknown[] = []): string {
    let text = this.strings[0];
    this.values.forEach((v, i) => {
      if (v instanceof Query) text += v.build(params);
      else {
        params.push(v);
        text += `$${params.length}`;
      }
      text += this.strings[i + 1];
    });
    return text;
  }

  then<A = Riga[], B = never>(
    ok?: ((v: Riga[]) => A | PromiseLike<A>) | null,
    ko?: ((e: unknown) => B | PromiseLike<B>) | null
  ): PromiseLike<A | B> {
    const params: unknown[] = [];
    const text = this.build(params);
    return this.db.query(text, params).then((r) => r.rows as Riga[]).then(ok, ko);
  }
}

export function creaSql() {
  const db = new PGlite();
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => new Query(db, strings, values);
  return { db, sql };
}

export type Sql = ReturnType<typeof creaSql>['sql'];

/** Tabella preventivi come in app/api/setup (solo le colonne usate dalla logica fatture). */
export async function creaPreventivi(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS preventivi (
      id SERIAL PRIMARY KEY,
      token TEXT UNIQUE NOT NULL,
      cliente_nome TEXT NOT NULL,
      cliente_azienda TEXT,
      cliente_email TEXT NOT NULL,
      oggetto TEXT NOT NULL,
      voci JSONB NOT NULL DEFAULT '[]',
      totale DECIMAL(10,2) NOT NULL,
      meta JSONB,
      stato TEXT DEFAULT 'inviato',
      accettato_at TIMESTAMPTZ,
      tranches_stato JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
