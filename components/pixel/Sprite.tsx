// Pixel art disegnata in codice: ogni sprite è una griglia di caratteri,
// ogni carattere un colore della palette ('.' = trasparente). Nitida a ogni scala.

type Palette = Record<string, string>;

interface Livello {
  art: string;
  className?: string;
}

function righe(art: string) {
  return art
    .trim()
    .split('\n')
    .map((r) => r.trim());
}

// Unisce i pixel consecutivi dello stesso colore in un solo rettangolo.
function rettangoli(art: string, pal: Palette) {
  const out: { x: number; y: number; w: number; fill: string }[] = [];
  righe(art).forEach((riga, y) => {
    let x = 0;
    while (x < riga.length) {
      const c = riga[x];
      let w = 1;
      while (riga[x + w] === c) w++;
      if (c !== '.' && pal[c]) out.push({ x, y, w, fill: pal[c] });
      x += w;
    }
  });
  return out;
}

export function Sprite({
  art,
  pal = { c: 'currentColor' },
  scala = 2,
  livelli = [],
  className = '',
  titolo,
}: {
  art: string;
  pal?: Palette;
  scala?: number;
  /** Livelli sovrapposti (fotogrammi di animazione, battito di ciglia...). */
  livelli?: Livello[];
  className?: string;
  titolo?: string;
}) {
  const r = righe(art);
  const h = r.length;
  const w = r[0]?.length ?? 0;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scala}
      height={h * scala}
      shapeRendering="crispEdges"
      className={`shrink-0 ${livelli.length ? 'px-anim' : ''} ${className}`}
      role={titolo ? 'img' : undefined}
      aria-label={titolo}
      aria-hidden={titolo ? undefined : true}
    >
      {rettangoli(art, pal).map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={1} fill={p.fill} />
      ))}
      {livelli.map((l, k) => (
        <g key={k} className={l.className}>
          {rettangoli(l.art, pal).map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width={p.w} height={1} fill={p.fill} />
          ))}
        </g>
      ))}
    </svg>
  );
}

// ── Icone 7x7, un colore (currentColor) ──

export const ICONE = {
  clessidra: `
    ccccccc
    .c...c.
    ..c.c..
    ...c...
    ..c.c..
    .ccccc.
    ccccccc`,
  bandiera: `
    ccccc..
    cccccc.
    ccccc..
    c......
    c......
    c......
    c......`,
  moneta: `
    ..ccc..
    .c...c.
    c..c..c
    c.ccc.c
    c..c..c
    .c...c.
    ..ccc..`,
  fumetto: `
    ccccccc
    c.....c
    c.c.c.c
    c.....c
    ccccccc
    .cc....
    .c.....`,
  esclamativo: `
    ..ccc..
    ..ccc..
    ..ccc..
    ..ccc..
    .......
    ..ccc..
    ..ccc..`,
  registro: `
    ccccccc
    .......
    ccccc..
    .......
    cccccc.
    .......
    cccc...`,
  calendario: `
    .c...c.
    ccccccc
    c.....c
    c.c.c.c
    c.....c
    c.c...c
    ccccccc`,
  domanda: `
    .ccccc.
    cc...cc
    .....cc
    ...ccc.
    ...cc..
    .......
    ...cc..`,
  spunta: `
    ......c
    .....cc
    c...cc.
    cc.cc..
    .ccc...
    ..c....
    .......`,
  casa: `
    ...c...
    ..ccc..
    .ccccc.
    ccccccc
    .c...c.
    .c.c.c.
    .ccccc.`,
  freccia: `
    ccccc
    .ccc.
    ..c..`,
} as const;

export type NomeIcona = keyof typeof ICONE;

export function Icona({ nome, scala = 2, className = '' }: { nome: NomeIcona; scala?: number; className?: string }) {
  return <Sprite art={ICONE[nome]} scala={scala} className={className} />;
}

// ── Il personaggio: al portatile, batte sui tasti quando c'è un lavoro in corso ──

const PAL_OMINO: Palette = {
  H: '#5A4034', // riflesso dei capelli (staccano dallo sfondo scuro)
  h: '#1E1511', // capelli, quasi neri
  b: '#2A1D17', // barba e baffi
  s: '#F2C29B', // pelle
  S: '#C97F68', // labbra
  e: '#0B0F1C', // occhi
  t: '#DCF23C', // maglia (il lime del marchio)
  L: '#C3CBE0', // retro del portatile
  g: '#3DD6F5', // logo acceso
  l: '#8E98B8', // tastiera
  d: '#283253', // scrivania
};

const OMINO = `
  ....HHHHHH....
  ...HhhhhhhH...
  ..HhhhhhhhhH..
  ..hhsssssshh..
  ..hssssssssh..
  ..ssessssess..
  ..bssssssssb..
  ..bssbbbbssb..
  ..bbbbbbbbbb..
  ...bbbbbbbb...
  ..tttttttttt..
  .tttttttttttt.
  .tLLLLLLLLLLt.
  .tLLLLggLLLLt.
  .tLLLLLLLLLLt.
  .tllllllllllt.
  dddddddddddddd`;

const vuota = (r: number) => Array(r).fill('..............').join('\n');

// Fotogrammi delle mani (sinistra giù / destra su, e viceversa).
const MANI_A = `${vuota(14)}
  ............s.
  .s............
  ..............`;

const MANI_B = `${vuota(14)}
  .s............
  ............s.
  ..............`;

const CIGLIA = `${vuota(5)}
  ....s....s....
${vuota(11)}`;

export function Omino({ scala = 6, alLavoro = false }: { scala?: number; alLavoro?: boolean }) {
  return (
    <Sprite
      art={OMINO}
      pal={PAL_OMINO}
      scala={scala}
      livelli={[
        { art: CIGLIA, className: 'px-blink' },
        ...(alLavoro
          ? [
              { art: MANI_A, className: 'px-f1' },
              { art: MANI_B, className: 'px-f2' },
            ]
          : [{ art: MANI_A }]),
      ]}
    />
  );
}
