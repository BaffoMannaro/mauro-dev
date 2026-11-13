import { Pixelify_Sans } from 'next/font/google';

// Font pixel per titoli e numeri grandi della pagina cliente (il testo resta in Noto Sans).
export const pixelFont = Pixelify_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-pixelify',
});
