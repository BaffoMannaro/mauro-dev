// Fonte del cliente: divisione INTERNA (da dove arriva il lavoro). Non va mai mostrata
// al cliente: vive solo su `clienti.fonte`, mai sui preventivi o nel loro meta.

export const FONTI = [
  { id: 'diretto', label: 'Diretto' },
  { id: 'astrolancer', label: 'Astrolancer' },
  { id: 'cream', label: 'Cream' },
] as const;

export type Fonte = (typeof FONTI)[number]['id'];

export const FONTE_IDS = FONTI.map((f) => f.id) as Fonte[];

export const fonteLabel = (id: string | null | undefined) =>
  FONTI.find((f) => f.id === id)?.label ?? 'Da assegnare';

/** Valore valido da salvare: id noto, oppure null (vuoto/assente = da assegnare). */
export const fonteValida = (v: unknown): Fonte | null =>
  typeof v === 'string' && (FONTE_IDS as string[]).includes(v) ? (v as Fonte) : null;

/** Classi del badge: colori tenui, distinguibili ma senza competere con l'accento. */
export const FONTE_BADGE: Record<string, string> = {
  diretto: 'bg-surface2 text-text border-edge',
  astrolancer: 'bg-blue-950/40 text-blue-400 border-blue-800/60',
  cream: 'bg-pink-950/30 text-pink-400 border-pink-800/40',
};
