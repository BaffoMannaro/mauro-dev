'use client';
// Game Review completa nel browser: analizza tutte le posizioni e salva il risultato.
import type { Motore } from './motore';
import { costruisciReview, leggiPgn, type AnalisiPosizione, type Review } from './partita';

export const PROFONDITA_REVIEW = 14;

export async function analizzaESalva(motore: Motore, id: number, pgn: string, onAvanzamento?: (x: number) => void): Promise<Review> {
  const letta = leggiPgn(pgn);
  const fens = [letta.fenIniziale, ...letta.mosse.map((x) => x.fenDopo)];
  const analisi: AnalisiPosizione[] = [];
  onAvanzamento?.(0);
  for (let i = 0; i < fens.length; i++) {
    analisi.push(await motore.analizza(fens[i], PROFONDITA_REVIEW));
    onAvanzamento?.((i + 1) / fens.length);
  }
  const review = costruisciReview(letta, analisi);
  await fetch(`/api/scacchi/partite/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review }),
  });
  return review;
}
