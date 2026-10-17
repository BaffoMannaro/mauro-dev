// Importi in euro, uguali in tutto il gestionale: "€2.400" nei riepiloghi, "€2.400,00" nelle righe.
// Le migliaia si raggruppano a mano: toLocaleString('it-IT') non raggruppa sotto 10.000 (€2400).

const migliaia = (intero: string) => intero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** €2.400 (arrotondato all'euro); negativi come -€215. */
export const euro = (n: number) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? '-' : ''}€${migliaia(String(Math.abs(v)))}`;
};

/** €2.400,00 (con i centesimi). */
export const euroCent = (n: number) => {
  const v = Number(n) || 0;
  const [intero, cent] = Math.abs(v).toFixed(2).split('.');
  return `${v < 0 ? '-' : ''}€${migliaia(intero)},${cent}`;
};
