// Repertorio di Mauro scelto sulle sue statistiche chess.com (novembre 2026):
// Bianco 1.e4 e Italiana; Nero 1...e5 e Giuoco Piano contro l'Italiana.
// Ogni mossa ha una spiegazione breve: il "perché", non solo il "cosa".
// Le linee sono verificate con chess.js (legalità) e Stockfish nei test.

/**
 * [mossa, spiegazione, segni sulla scacchiera dopo la mossa].
 * Segni: "g:c4f7" freccia, "r@c4" casa evidenziata. Colori: g = tu (verde), r = avversario (rosso), b = piano (blu).
 */
export type MossaLinea = [san: string, perche: string, segni?: string];

export type ColoreSegno = 'g' | 'r' | 'b';
export type Segno = { c: ColoreSegno; da: string; a: string } | { c: ColoreSegno; casa: string };

const CASA = /^[a-h][1-8]$/;

/** Legge la stringa dei segni ("g:c4f7 r@c4"). Lancia su segni malformati. */
export function leggiSegni(s?: string): Segno[] {
  if (!s) return [];
  return s.split(/\s+/).filter(Boolean).map((t) => {
    const c = t[0] as ColoreSegno;
    if (!'grb'.includes(c)) throw new Error(`Colore non valido: ${t}`);
    if (t[1] === '@' && CASA.test(t.slice(2))) return { c, casa: t.slice(2) };
    const q = t.slice(2);
    if (t[1] === ':' && CASA.test(q.slice(0, 2)) && CASA.test(q.slice(2)) && q.length === 4) return { c, da: q.slice(0, 2), a: q.slice(2) };
    throw new Error(`Segno non valido: ${t}`);
  });
}

export type Linea = {
  id: string;
  titolo: string;
  /** Colore giocato da Mauro in questa linea. */
  colore: 'w' | 'b';
  gruppo: string;
  /** Perché la studiamo: legata alle sue statistiche. */
  motivo: string;
  mosse: MossaLinea[];
  /** Idee del mediogioco una volta finita la linea. */
  piani: string[];
};

export const REPERTORIO: Linea[] = [
  // ── Bianco: Italiana ─────────────────────────────────────────────────
  {
    id: 'b-italiana-piano',
    titolo: 'Italiana: Giuoco Pianissimo',
    colore: 'w',
    gruppo: 'Bianco · Italiana',
    motivo: 'La tua apertura col Bianco (55% di vittorie). La impari bene una volta e ti serve anche col Nero.',
    mosse: [
      ['e4', 'Occupa il centro e apre la strada ad Alfiere e Donna.', 'g:e4d5 g:e4f5 b:f1c4 b:d1h5'],
      ['e5', 'Il Nero risponde simmetrico e contende il centro.', 'r:e5d4 r:e5f4'],
      ['Nf3', 'Sviluppa il Cavallo verso il centro e attacca subito il pedone e5.', 'g:f3e5 r@e5'],
      ['Nc6', 'Il Nero difende e5 sviluppando un pezzo.', 'r:c6e5'],
      ['Bc4', 'L\'Alfiere punta f7, la casa più debole del Nero (difesa solo dal Re).', 'g:c4f7 g@f7 r:e8f7'],
      ['Bc5', 'Il Nero fa lo stesso: il suo Alfiere punta f2.', 'r:c5f2 r@f2'],
      ['c3', 'Prepara d4 per prendersi il centro e dà all\'Alfiere una ritirata in c2.', 'g:c3d4 b:d2d4 b@c2'],
      ['Nf6', 'Il Nero sviluppa e attacca e4.', 'r:f6e4 r@e4'],
      ['d3', 'Difende e4 con calma. Si gioca d4 più avanti, quando è tutto pronto.', 'g:d3e4'],
      ['d6', 'Il Nero rinforza e5 e apre la diagonale dell\'Alfiere c8.', 'r:d6e5 r:c8g4'],
      ['O-O', 'Re al sicuro prima di aprire il gioco. Regola d\'oro: arrocca presto.', 'g@g1'],
      ['O-O', 'Anche il Nero mette il Re al sicuro.', 'r@g8'],
      ['Re1', 'La Torre sostiene e4 e si prepara per quando la colonna e si aprirà.', 'g:e1e4'],
      ['a6', 'Il Nero prepara una ritirata per l\'Alfiere (Ba7) per non subire b4-b5 o d4.', 'r:c5a7 r:a6b5'],
      ['Bb3', 'L\'Alfiere lascia c4, dove ...d5 lo attaccherebbe guadagnando un tempo. Se poi arriva ...Na5 (attacca b3), si ritira in c2: è la casa che hai preparato con c3.', 'r:d6d5 r:c6a5 r@c4 b:b3c2'],
      ['Ba7', 'Il Nero fa lo stesso.', 'r:a7f2 r@f2'],
      ['h3', 'Toglie la casa g4 all\'Alfiere nero (niente inchiodatura del Cavallo f3). Poi Nbd2-f1-g3.', 'g:h3g4 r:c8g4 b:b1d2 b:d2f1 b:f1g3'],
    ],
    piani: [
      'Manovra tipica: Nbd2, Nf1, Ng3 per portare il Cavallo verso f5.',
      'Quando sei pronto spingi d4 per aprire il centro.',
      'Attento a ...Ng4 contro f2: h3 serve anche a questo.',
    ],
  },
  {
    id: 'b-italiana-duecavalli',
    titolo: 'Italiana contro la Due Cavalli (3...Nf6)',
    colore: 'w',
    gruppo: 'Bianco · Italiana',
    motivo: 'Dopo 3.Bc4 molti avversari giocano 3...Nf6: con 4.d3 eviti la teoria complicata e giochi le stesse idee.',
    mosse: [
      ['e4', 'Centro.', 'g:e4d5 g:e4f5'],
      ['e5', ''],
      ['Nf3', 'Attacca e5.', 'g:f3e5'],
      ['Nc6', ''],
      ['Bc4', 'Punta f7.', 'g:c4f7 g@f7'],
      ['Nf6', 'Due Cavalli: il Nero attacca subito e4.', 'r:f6e4 r@e4'],
      ['d3', 'Difesa semplice di e4. Niente 4.Ng5: porta a linee molto teoriche dove a blitz si sbaglia facilmente.', 'g:d3e4'],
      ['Be7', 'Sviluppo solido. Se gioca 4...Bc5 sei nel Giuoco Pianissimo.'],
      ['O-O', 'Re al sicuro.', 'g@g1'],
      ['O-O', ''],
      ['Re1', 'La Torre difende e4 e libera f1 per il Cavallo.', 'g:e1e4 b:b1d2 b:d2f1'],
      ['d6', 'Il Nero sostiene e5.', 'r:d6e5'],
      ['c3', 'Prepara d4 e la ritirata Bc2.', 'g:c3d4 b@c2'],
      ['Na5', 'Il Cavallo caccia l\'Alfiere.', 'r:a5c4 r@c4'],
      ['Bb5', 'L\'Alfiere resta attivo. Su ...a6 torni in a4 e poi c2.', 'r:a7a6 b:b5a4 b:a4c2'],
    ],
    piani: [
      'Stesse manovre del Giuoco Pianissimo: Nbd2-f1-g3, h3, poi d4.',
      'Non lasciare che il Nero cambi il tuo Alfiere campochiaro senza motivo.',
    ],
  },
  {
    id: 'b-philidor',
    titolo: 'Contro la Philidor (2...d6)',
    colore: 'w',
    gruppo: 'Bianco · Difese scomode',
    motivo: 'Contro la Philidor vinci solo il 43% delle partite (95 partite) ed esci dalla teoria presto.',
    mosse: [
      ['e4', ''],
      ['e5', ''],
      ['Nf3', ''],
      ['d6', 'Philidor: il Nero difende e5 con un pedone, ma chiude il suo Alfiere f8.', 'r:d6e5 r@f8'],
      ['d4', 'Attacca subito il centro: la Philidor è passiva e va punita con lo spazio.', 'g:d4e5 g@d4'],
      ['exd4', 'La scelta più comune: il Nero cede il centro.'],
      ['Nxd4', 'Ricatturi col Cavallo in posizione centrale e dominante.', 'g:d4e6 g:d4c6 g:d4f5'],
      ['Nf6', 'Il Nero attacca e4.', 'r:f6e4 r@e4'],
      ['Nc3', 'Difendi e4 sviluppando.', 'g:c3e4'],
      ['Be7', ''],
      ['Bf4', 'Alfiere attivo che punta d6, il punto debole della struttura nera.', 'g:f4d6 g@d6'],
      ['O-O', ''],
      ['Qd2', 'Collega le Torri e prepara l\'arrocco lungo.', 'b:e1c1'],
      ['a6', ''],
      ['O-O-O', 'Arrocco lungo: Torre subito in d1 contro d6, e puoi spingere i pedoni g e h verso il Re nero.', 'g:d1d6 g@d6 b:g2g4 b:f2f3'],
    ],
    piani: [
      'Spazio e attacco: f3, g4, g5 contro il Re arroccato corto.',
      'Il pedone d6 è debole: tieni sotto pressione la colonna d.',
      'Se il Nero non cattura (3...Nd7), gioca Bc4 e minaccia Bxf7+ e Ng5.',
    ],
  },
  {
    id: 'b-scandinava',
    titolo: 'Contro la Scandinava (1...d5)',
    colore: 'w',
    gruppo: 'Bianco · Difese scomode',
    motivo: 'Oggi esci dalla teoria già alla seconda mossa (45% di vittorie in 87 partite). Un solo schema per tutte le varianti.',
    mosse: [
      ['e4', ''],
      ['d5', 'Scandinava: il Nero attacca subito e4.', 'r:d5e4 r@e4'],
      ['exd5', 'Prendi: il Nero dovrà riprendere con la Donna (o col Cavallo dopo ...Nf6).', 'g@d5'],
      ['Qxd5', 'La Donna nera esce presto: ne approfitti guadagnando tempi.', 'r@d5'],
      ['Nc3', 'Sviluppi e attacchi la Donna: un tempo guadagnato.', 'g:c3d5'],
      ['Qa5', 'La casa più usata: la Donna resta attiva e inchioda il Cavallo c3.', 'r:a5c3 r:a5e1 r@c3'],
      ['d4', 'Centro pieno e via libera all\'Alfiere c1.', 'g:c1g5 g:d4e5'],
      ['Nf6', ''],
      ['Nf3', 'Sviluppo naturale.', 'g:f3d4 g:f3e5'],
      ['c6', 'Il Nero dà una ritirata alla Donna (...Qc7).', 'r:a5c7'],
      ['Bc4', 'Alfiere attivo verso f7.', 'g:c4f7 g@f7'],
      ['Bf5', '', 'r:f5c2 r@c2'],
      ['Bd2', 'Toglie l\'inchiodatura su c3: ora il Cavallo è libero di saltare in d5 o e4, e la Donna nera in a5 rischia di diventare un bersaglio.', 'g:d2c3 b:c3d5 b:c3e4'],
      ['e6', ''],
      ['Qe2', 'Prepara l\'arrocco lungo e la spinta d5 oppure Ne5.', 'b:e1c1 b:f3e5'],
    ],
    piani: [
      'Arrocco lungo e Ne5: pressione su f7.',
      'Se la Donna nera torna in d6 o d8, continua a sviluppare con tempo (Bd2, Qe2, O-O-O).',
      'Contro 2...Nf6 gioca 3.d4: se ...Nxd5 continui con Nf3, c4 e un grande centro.',
    ],
  },
  {
    id: 'b-carokann',
    titolo: 'Contro la Caro-Kann (1...c6)',
    colore: 'w',
    gruppo: 'Bianco · Difese scomode',
    motivo: 'Contro la Caro-Kann vinci il 45%: con la variante d\'avanzata giochi un sistema semplice basato sullo spazio.',
    mosse: [
      ['e4', ''],
      ['c6', 'Caro-Kann: prepara ...d5 tenendo libero l\'Alfiere c8.', 'r:d7d5 r:c8f5'],
      ['d4', 'Centro pieno.', 'g:d4e5 g:d4c5'],
      ['d5', ''],
      ['e5', 'Avanzata: guadagni spazio e togli f6 al Cavallo nero.', 'g:e5f6 g:e5d6 g@f6'],
      ['Bf5', 'L\'Alfiere esce prima di ...e6, il punto di forza della Caro-Kann.', 'r@f5'],
      ['Nf3', 'Sviluppo semplice, sostiene d4.', 'g:f3d4'],
      ['e6', ''],
      ['Be2', 'Sviluppo tranquillo, pronto ad arroccare.', 'b:e1g1'],
      ['c5', 'Il Nero attacca la base della catena d4.', 'r:c5d4 r@d4'],
      ['O-O', 'Re al sicuro; se ...cxd4 riprendi col Cavallo o con la Donna.', 'g@g1'],
      ['Nc6', '', 'r:c6d4'],
      ['c3', 'Sostiene d4: la catena di pedoni c3-d4-e5 ti dà spazio.', 'g:c3d4 g@c3 g@d4 g@e5'],
    ],
    piani: [
      'Gioca sull\'ala di Re grazie allo spazio: Nbd2, Nb3, a volte g4 per cacciare l\'Alfiere f5.',
      'Proteggi d4: è il punto che il Nero attaccherà con ...c5, ...Nc6, ...Qb6.',
    ],
  },

  // ── Nero: Giuoco Piano e dintorni ────────────────────────────────────
  {
    id: 'n-italiana-piano',
    titolo: 'Nero: Giuoco Piano contro l\'Italiana',
    colore: 'b',
    gruppo: 'Nero · contro 1.e4',
    motivo: 'Contro l\'Italiana vinci solo il 35% (77 partite). Stessa struttura che giochi col Bianco.',
    mosse: [
      ['e4', 'Il Bianco occupa il centro.', 'r:e4d5 r:e4f5'],
      ['e5', 'Rispondi simmetrico: contendi il centro e apri le diagonali.', 'g:e5d4 g:e5f4'],
      ['Nf3', 'Attacca e5.', 'r:f3e5 r@e5'],
      ['Nc6', 'Difendi e5 sviluppando un pezzo.', 'g:c6e5'],
      ['Bc4', 'Italiana: l\'Alfiere punta f7.', 'r:c4f7 r@f7'],
      ['Bc5', 'Giuoco Piano: anche il tuo Alfiere punta il punto debole del Bianco, f2.', 'g:c5f2 g@f2'],
      ['c3', 'Il Bianco prepara d4.', 'r:c3d4 r:d2d4'],
      ['Nf6', 'Sviluppi e attacchi e4: se il Bianco gioca d4 subito, avrai controgioco su e4.', 'g:f6e4 g@e4'],
      ['d3', 'Il Bianco difende e4 con calma.', 'r:d3e4'],
      ['d6', 'Rinforzi e5 e apri l\'Alfiere c8.', 'g:d6e5 g:c8g4'],
      ['O-O', ''],
      ['O-O', 'Re al sicuro. Prima l\'arrocco, poi i piani.', 'g@g8'],
      ['Re1', ''],
      ['a6', 'Prepari Ba7: l\'Alfiere non potrà essere cacciato da b4 o d4 con tempo.', 'r:b2b4 b:c5a7'],
      ['Bb3', '', 'r:b3f7 r@f7'],
      ['Ba7', 'Alfiere al sicuro, sempre puntato su f2.', 'g:a7f2 g@f2'],
      ['h3', 'Il Bianco toglie g4.', 'r:h3g4'],
      ['Re8', 'Anche tu metti la Torre sulla colonna e e prepari ...Be6 o ...h6.', 'g:e8e5 b:c8e6 b:h7h6'],
    ],
    piani: [
      'Ottima casa per l\'Alfiere c8: e6, per cambiare l\'Alfiere b3 del Bianco.',
      'Controlla sempre f7: se vedi Ng5 con l\'Alfiere su c4 o b3, verifica la minaccia su f7.',
      'Piano tipico: ...h6, ...Be6, poi ...d5 quando è possibile.',
    ],
  },
  {
    id: 'n-italiana-arrocco',
    titolo: 'Nero: Italiana con 4.O-O',
    colore: 'b',
    gruppo: 'Nero · contro 1.e4',
    motivo: 'Variante frequente a blitz: il Bianco arrocca subito. Basta sapere la trappola su e4.',
    mosse: [
      ['e4', ''],
      ['e5', ''],
      ['Nf3', ''],
      ['Nc6', ''],
      ['Bc4', '', 'r:c4f7 r@f7'],
      ['Bc5', 'Giuoco Piano.', 'g:c5f2 g@f2'],
      ['O-O', 'Il Bianco arrocca subito.'],
      ['Nf6', 'Sviluppi attaccando e4.', 'g:f6e4 g@e4'],
      ['d3', 'Il Bianco difende e4. (Se gioca Re1 o Nc3 il gioco resta simile.)', 'r:d3e4'],
      ['d6', 'Sostieni e5 e liberi l\'Alfiere c8.', 'g:d6e5 g:c8g4'],
      ['c3', '', 'r:c3d4'],
      ['O-O', 'Re al sicuro.', 'g@g8'],
      ['Re1', ''],
      ['a6', 'Ritirata pronta per l\'Alfiere: stessa struttura del Giuoco Pianissimo.', 'b:c5a7'],
    ],
    piani: ['Stesse idee della linea principale: ...Ba7, ...h6, ...Be6.'],
  },
  {
    id: 'n-evans',
    titolo: 'Nero: Gambetto Evans (4.b4)',
    colore: 'b',
    gruppo: 'Nero · contro 1.e4',
    motivo: 'Il gambetto più aggressivo contro il Giuoco Piano: va conosciuto per non finire travolto.',
    mosse: [
      ['e4', ''],
      ['e5', ''],
      ['Nf3', ''],
      ['Nc6', ''],
      ['Bc4', ''],
      ['Bc5', ''],
      ['b4', 'Evans: il Bianco offre un pedone per guadagnare tempi e fare c3 e d4.', 'r:b4c5 r@b4'],
      ['Bxb4', 'Accetta: il pedone è gratis e il Bianco deve dimostrare il compenso.', 'g@b4'],
      ['c3', 'Attacca l\'Alfiere e prepara d4.', 'r:c3b4 r:d2d4'],
      ['Ba5', 'Tieni l\'Alfiere sulla diagonale verso e1 e c3.', 'g:a5c3 g:a5e1'],
      ['d4', 'Il Bianco apre il centro.', 'r:d4e5 r@e5'],
      ['exd4', 'Prendi.', 'g@d4'],
      ['O-O', 'Il Bianco continua con lo sviluppo.'],
      ['Nge7', 'Cavallo in e7 e non in f6: evita e4-e5 con tempo e protegge c6 e d5.', 'g:e7d5 g:e7c6 r:e4e5'],
    ],
    piani: [
      'Restituire il pedone con ...d5 al momento giusto va benissimo: conta sviluppare e arroccare.',
      'Attento a Qb3 contro f7: tieni il Cavallo e7 e la Donna vicini al Re.',
    ],
  },
  {
    id: 'n-alfiere',
    titolo: 'Nero: Apertura di Alfiere (2.Bc4)',
    colore: 'b',
    gruppo: 'Nero · contro 1.e4',
    motivo: 'Contro 2.Bc4 vinci solo il 32% (38 partite): basta uno schema semplice.',
    mosse: [
      ['e4', ''],
      ['e5', ''],
      ['Bc4', 'Apertura di Alfiere: punta f7 subito.', 'r:c4f7 r@f7'],
      ['Nf6', 'Sviluppi e attacchi e4: è la risposta migliore.', 'g:f6e4 g@e4'],
      ['d3', 'Il Bianco difende e4.', 'r:d3e4'],
      ['Bc5', 'Alfiere attivo, come nel Giuoco Piano.', 'g:c5f2 g@f2'],
      ['Nf3', 'Si torna al Giuoco Piano.'],
      ['d6', 'Sostieni e5.', 'g:d6e5'],
      ['c3', '', 'r:c3d4'],
      ['O-O', 'Re al sicuro.', 'g@g8'],
    ],
    piani: [
      'Se il Bianco gioca Qh5 o Qf3 contro f7, difendi con ...Qe7 o ...Qe7/...g6 e sviluppa con tempo attaccando la Donna.',
      'Struttura e piani del Giuoco Piano.',
    ],
  },
  {
    id: 'n-scozzese',
    titolo: 'Nero: Scozzese (3.d4)',
    colore: 'b',
    gruppo: 'Nero · contro 1.e4',
    motivo: 'Contro la Scozzese vinci il 38% (37 partite): con 4...Nf6 hai un piano chiaro.',
    mosse: [
      ['e4', ''],
      ['e5', ''],
      ['Nf3', ''],
      ['Nc6', ''],
      ['d4', 'Scozzese: il Bianco apre subito il centro.', 'r:d4e5 r@e5'],
      ['exd4', 'Prendi: non puoi mantenere e5.'],
      ['Nxd4', ''],
      ['Nf6', 'Sviluppi attaccando e4.', 'g:f6e4 g@e4'],
      ['Nxc6', 'La mossa più comune.'],
      ['bxc6', 'Riprendi verso il centro: il pedone c6 controlla d5.', 'g:c6d5 g@d5'],
      ['e5', 'Il Bianco caccia il Cavallo.', 'r:e5f6 r@f6'],
      ['Qe7', 'Inchiodi il pedone e5 al Re: il Bianco deve difenderlo con Qe2.', 'g:e7e5 g:e7e1'],
      ['Qe2', '', 'r:e2e5'],
      ['Nd5', 'Cavallo forte al centro.', 'g@d5'],
    ],
    piani: ['Gioca ...g6 e ...Bg7 contro il pedone e5, poi ...O-O.', 'Su c4 del Bianco il Cavallo torna in b6.'],
  },
  {
    id: 'n-spagnola',
    titolo: 'Nero: Spagnola (3.Bb5)',
    colore: 'b',
    gruppo: 'Nero · contro 1.e4',
    motivo: 'Contro la Spagnola vinci il 42%: la variante chiusa con ...Be7 è solida e facile da giocare.',
    mosse: [
      ['e4', ''],
      ['e5', ''],
      ['Nf3', ''],
      ['Nc6', ''],
      ['Bb5', 'Spagnola: il Bianco attacca il difensore di e5.', 'r:b5c6 r:c6e5'],
      ['a6', 'Chiedi subito all\'Alfiere cosa vuole fare.', 'g:a6b5'],
      ['Ba4', 'L\'Alfiere si ritira mantenendo la pressione.', 'r:a4c6'],
      ['Nf6', 'Sviluppi attaccando e4.', 'g:f6e4 g@e4'],
      ['O-O', ''],
      ['Be7', 'Sviluppo solido, pronto ad arroccare.', 'b:e8g8'],
      ['Re1', ''],
      ['b5', 'Cacci l\'Alfiere per togliere la pressione su c6.', 'g:b5a4 g@b5'],
      ['Bb3', '', 'r:b3f7 r@f7'],
      ['d6', 'Sostieni e5.', 'g:d6e5'],
      ['c3', '', 'r:c3d4'],
      ['O-O', 'Re al sicuro.', 'g@g8'],
    ],
    piani: [
      'Attento alla trappola: se il Bianco prende in c6 e poi in e5, controlla che non vinca un pedone.',
      'Piani tipici: ...Na5 contro l\'Alfiere b3, ...c5, ...Bb7.',
    ],
  },
];

export function trovaLinea(id: string) {
  return REPERTORIO.find((l) => l.id === id) ?? null;
}
