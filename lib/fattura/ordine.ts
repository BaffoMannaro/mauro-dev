// Ordine delle fatture: fa fede il numero, non la data. Prima l'anno, poi il numero
// progressivo come numero ("10" dopo "9"), dalla più recente alla meno recente.
// Funzione pura, usata anche nel browser; l'equivalente SQL è ordineFatture() in server.ts.

/** Numero progressivo della fattura: il primo gruppo di cifre del numero ("12", "12/A", "FPR 12/26" → 12). */
const progressivo = (numero: string | null | undefined) => {
  const m = /\d+/.exec(numero ?? '');
  return m ? Number(m[0]) : -1;
};
const annoDi = (f: { anno?: number | null; data?: string | null }) => f.anno ?? (f.data ? Number(f.data.slice(0, 4)) : 0);

/** Da usare con .sort(): più recente prima (anno, poi numero). */
export function piuRecentePrima(
  a: { id: number; numero: string | null; anno?: number | null; data?: string | null },
  b: { id: number; numero: string | null; anno?: number | null; data?: string | null },
) {
  return annoDi(b) - annoDi(a) || progressivo(b.numero) - progressivo(a.numero) || b.id - a.id;
}
