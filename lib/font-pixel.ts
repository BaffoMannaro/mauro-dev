import { Tiny5 } from 'next/font/google';

// Font pixel per titoli e numeri grandi della pagina cliente (il testo resta in Noto Sans).
// Tiny5 al posto di Pixelify Sans: in Pixelify il 5 si confonde con la S (€650 → €6S0).
export const pixelFont = Tiny5({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pixelify',
});
