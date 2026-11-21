'use client';

import { createContext, useContext } from 'react';
import { SET_PREDEFINITO, type SetPezzi } from '@/lib/scacchi/pezzi';

const Ctx = createContext<SetPezzi>(SET_PREDEFINITO);

export function TemaScacchi({ pezzi, children }: { pezzi: SetPezzi; children: React.ReactNode }) {
  return <Ctx.Provider value={pezzi}>{children}</Ctx.Provider>;
}

export const useSetPezzi = () => useContext(Ctx);

/** Percorso dell'immagine di un pezzo (codice tipo "wK"), null per il set classico integrato. */
export function srcPezzo(set: SetPezzi, codice: string) {
  return set === 'classico' ? null : `/scacchi/pezzi/${set}/${codice}.svg`;
}
