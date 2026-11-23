import { VALORI_PEZZI } from './classifica';

export type Fase = 'apertura' | 'mediogioco' | 'finale';

/** Fase dalla posizione: apertura fino alla 10ª mossa, finale con poco materiale (senza pedoni e re ≤ 26 punti in tutto). */
export function faseDi(ply: number, fen: string): Fase {
  const pezzi = fen.split(' ')[0].replace(/[pPkK1-8/]/g, '');
  const materiale = [...pezzi].reduce((s, ch) => s + (VALORI_PEZZI[ch.toLowerCase()] ?? 0), 0);
  if (materiale <= 26) return 'finale';
  if (ply <= 20) return 'apertura';
  return 'mediogioco';
}

