// Set di pezzi disponibili. "Neo" di chess.com è proprietario: il predefinito è Staunty,
// il set libero più simile (sadsnake1, CC BY-NC-SA 4.0, da lichess-org/lila).
export const SET_PEZZI = {
  staunty: 'Staunty (simile a chess.com)',
  gioco: 'Gioco',
  fresca: 'Fresca',
  classico: 'Classico (cburnett)',
} as const;

export type SetPezzi = keyof typeof SET_PEZZI;
export const SET_PREDEFINITO: SetPezzi = 'staunty';

export function setValido(x: unknown): x is SetPezzi {
  return typeof x === 'string' && x in SET_PEZZI;
}

export const CREDITI_PEZZI: Record<SetPezzi, string> = {
  staunty: 'Pezzi Staunty di sadsnake1 (CC BY-NC-SA 4.0)',
  gioco: 'Pezzi Gioco di sadsnake1 (CC BY-NC-SA 4.0)',
  fresca: 'Pezzi Fresca di sadsnake1 (CC BY-NC-SA 4.0)',
  classico: 'Pezzi di Colin M.L. Burnett (GPLv2+)',
};
