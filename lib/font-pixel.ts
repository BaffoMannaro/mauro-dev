import { Silkscreen } from 'next/font/google';

// Font pixel per titoli e numeri della pagina cliente (il testo resta in Noto Sans).
// Silkscreen: cifre larghe e nette, le più leggibili tra i font pixel provati
// (Pixelify Sans confondeva il 5 con la S, Tiny5 era troppo stretto).
export const pixelFont = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pixelify',
});
