// Calcolo del monte ore di un canone mensile (logica pura, senza database).
//
// Regole (accordo con il cliente):
// - ogni mese il canone dà `ore_mese` ore;
// - le ore non usate passano al mese dopo e valgono solo per quel mese (riporto_mesi = 1),
//   poi scadono;
// - le ore usate consumano prima quelle riportate (scadono prima), poi quelle del mese;
// - oltre il disponibile le ore sono extra, a tariffa piena.
// Tutto in minuti interi per evitare errori di arrotondamento.

export interface CanoneBase {
  ore_mese: number;
  prezzo_mese: number;
  tariffa_extra: number;
  /** Primo mese del canone, YYYY-MM-DD (conta il mese). */
  inizio: string;
  /** Ultimo mese del canone (incluso), facoltativo. */
  fine?: string | null;
  /** Per quanti mesi successivi valgono le ore non usate (default 1). */
  riporto_mesi?: number;
}

export interface InterventoBase {
  data: string; // YYYY-MM-DD
  minuti: number;
  fuori_canone?: boolean;
}

export interface MeseCanone {
  mese: string; // YYYY-MM
  incluse: number; // minuti del canone di questo mese
  riportate: number; // minuti arrivati dai mesi precedenti
  usate: number; // minuti di interventi a canone
  da_riporto: number; // parte delle usate presa dalle riportate
  da_incluse: number; // parte delle usate presa dal mese
  extra: number; // minuti oltre il disponibile
  rimaste: number; // minuti ancora disponibili a fine mese (o adesso, per il mese in corso)
  scadono: number; // minuti riportati non usati che scadono a fine mese
  riporto_prossimo: number; // minuti che passano al mese dopo
  fuori_canone: number; // minuti di interventi fuori canone (fatturati a parte)
  costo_extra: number; // euro
}

export const meseDi = (data: string) => data.slice(0, 7);

export function meseSuccessivo(mese: string) {
  const [a, m] = mese.split('-').map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
}

export function mesiTra(da: string, a: string) {
  const out: string[] = [];
  for (let m = da; m <= a; m = meseSuccessivo(m)) out.push(m);
  return out;
}

/** Mesi del canone dall'inizio al mese di `oggi` (o alla fine, se prima). */
export function calcolaMesi(canone: CanoneBase, interventi: InterventoBase[], oggi: string): MeseCanone[] {
  const primo = meseDi(canone.inizio);
  let ultimo = meseDi(oggi);
  if (canone.fine && meseDi(canone.fine) < ultimo) ultimo = meseDi(canone.fine);
  if (ultimo < primo) return [];

  const durata = Math.max(1, canone.riporto_mesi ?? 1);
  const inclusePerMese = Math.round(canone.ore_mese * 60);

  const usatePerMese = new Map<string, number>();
  const fuoriPerMese = new Map<string, number>();
  for (const i of interventi) {
    const m = meseDi(i.data);
    const mappa = i.fuori_canone ? fuoriPerMese : usatePerMese;
    mappa.set(m, (mappa.get(m) ?? 0) + Math.max(0, Math.round(i.minuti)));
  }

  // Lotti di ore ancora vivi: minuti residui e ultimo mese in cui valgono.
  let lotti: { minuti: number; valido_fino: string }[] = [];
  const out: MeseCanone[] = [];

  for (const mese of mesiTra(primo, ultimo)) {
    lotti = lotti.filter((l) => l.valido_fino >= mese && l.minuti > 0);
    const riportate = lotti.reduce((s, l) => s + l.minuti, 0);

    let valido = mese;
    for (let k = 0; k < durata; k++) valido = meseSuccessivo(valido);
    const lottoMese = { minuti: inclusePerMese, valido_fino: valido };

    const usate = usatePerMese.get(mese) ?? 0;
    let resto = usate;
    let daRiporto = 0;
    // Prima i lotti che scadono prima (ordinati per scadenza).
    for (const l of [...lotti].sort((a, b) => a.valido_fino.localeCompare(b.valido_fino))) {
      const preso = Math.min(l.minuti, resto);
      l.minuti -= preso;
      daRiporto += preso;
      resto -= preso;
    }
    const daIncluse = Math.min(lottoMese.minuti, resto);
    lottoMese.minuti -= daIncluse;
    resto -= daIncluse;

    const scadono = lotti.filter((l) => l.valido_fino === mese).reduce((s, l) => s + l.minuti, 0);
    lotti.push(lottoMese);
    const rimaste = lotti.reduce((s, l) => s + l.minuti, 0);

    out.push({
      mese,
      incluse: inclusePerMese,
      riportate,
      usate,
      da_riporto: daRiporto,
      da_incluse: daIncluse,
      extra: resto,
      rimaste,
      scadono,
      riporto_prossimo: rimaste - scadono,
      fuori_canone: fuoriPerMese.get(mese) ?? 0,
      costo_extra: Math.round(((resto * canone.tariffa_extra) / 60) * 100) / 100,
    });
  }
  return out;
}

/** "3 h 30 min", "45 min", "2 h". */
export function fmtMinuti(min: number) {
  const m = Math.round(Math.abs(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  const s = h && r ? `${h} h ${r} min` : h ? `${h} h` : `${r} min`;
  return min < 0 ? `-${s}` : s;
}

const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** "novembre 2026". */
export function nomeMese(mese: string) {
  const [a, m] = mese.split('-').map(Number);
  return `${MESI[m - 1]} ${a}`;
}

/** Accetta "1:30", "1.5", "1,5", "90m", "2h": restituisce minuti. */
export function parseOre(v: string | number): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? Math.round(v * 60) : null;
  const s = v.trim().toLowerCase().replace(',', '.');
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d+):(\d{1,2})$/))) return Number(m[1]) * 60 + Number(m[2]) || null;
  if ((m = s.match(/^(\d+)\s*m(in)?$/))) return Number(m[1]) || null;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*h?$/))) return Math.round(Number(m[1]) * 60) || null;
  return null;
}
