'use client';

// Mattoncini condivisi dell'area cliente in stile pixel (pagina ore e portale):
// colori per area, riquadri a scalino, titoli con icona, intestazione con le schede.
import { Icona, type NomeIcona } from '@/components/pixel/Sprite';

// Ogni area della pagina ha un colore: aiuta a orientarsi e a ritrovare le cose.
export type Area = 'ore' | 'lavori' | 'soldi' | 'azione' | 'fatto' | 'fumo';
export const AREA: Record<Area, { testo: string; sfondo: string; tenue: string; var: string }> = {
  ore: { testo: 'text-ore', sfondo: 'bg-ore', tenue: 'bg-ore/15', var: 'var(--color-ore)' },
  lavori: { testo: 'text-lavori', sfondo: 'bg-lavori', tenue: 'bg-lavori/15', var: 'var(--color-lavori)' },
  soldi: { testo: 'text-soldi', sfondo: 'bg-soldi', tenue: 'bg-soldi/15', var: 'var(--color-soldi)' },
  azione: { testo: 'text-azione', sfondo: 'bg-azione', tenue: 'bg-azione/15', var: 'var(--color-azione)' },
  fatto: { testo: 'text-fatto', sfondo: 'bg-fatto', tenue: 'bg-fatto/15', var: 'var(--color-fatto)' },
  fumo: { testo: 'text-nebbia', sfondo: 'bg-fumo', tenue: 'bg-fumo/15', var: 'var(--color-ink-4)' },
};

export const LARGHEZZA = 'max-w-[1760px] mx-auto px-4 sm:px-6 xl:px-10';

export function Tile({ area, id, className = '', children }: { area: Area; id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className={`px-notch bg-ink-2 p-4 sm:p-5 min-w-0 min-h-0 flex flex-col ${className}`}
      style={{ boxShadow: `inset 0 4px 0 ${AREA[area].var}` }}
    >
      {children}
    </section>
  );
}

export function Titolo({ area, icona, children, destra }: { area: Area; icona: NomeIcona; children: React.ReactNode; destra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4 shrink-0">
      <h2 className="flex items-center gap-2.5 font-pixel text-[15px] leading-none text-chiaro">
        <span className={`grid place-items-center w-7 h-7 px-notch-sm ${AREA[area].tenue} ${AREA[area].testo}`}>
          <Icona nome={icona} />
        </span>
        {children}
      </h2>
      {destra}
    </div>
  );
}

export function Etichetta({ area, children }: { area: Area; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-notch-sm font-pixel text-[10px] leading-none px-2 py-1 ${AREA[area].tenue} ${AREA[area].testo}`}>
      {children}
    </span>
  );
}

/** Numero "a colpo d'occhio" nel riquadro di benvenuto. */
export function Lampo({ area, valore, label, className = '' }: { area: Area; valore: string; label: string; className?: string }) {
  return (
    <div className={`bg-ink-3 px-notch-sm px-3 py-2.5 min-w-0 ${className}`}>
      <p className={`font-pixel text-base sm:text-xl leading-none truncate ${AREA[area].testo}`}>{valore}</p>
      <p className="text-[11px] text-fumo mt-1 truncate">{label}</p>
    </div>
  );
}
