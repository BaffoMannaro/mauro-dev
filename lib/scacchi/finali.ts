// Finali base da giocare contro Stockfish a piena forza.
// Posizioni verificate nei test: quelle da vincere risultano vinte, quelle da pareggiare in equilibrio.

export type Obiettivo = 'matto' | 'promuovi' | 'patta';

export type Finale = {
  id: string;
  titolo: string;
  gruppo: string;
  /** Colore giocato da Mauro. */
  colore: 'w' | 'b';
  fen: string;
  obiettivo: Obiettivo;
  /** Mosse di Mauro a disposizione: per vincere entro N mosse, o da resistere per la patta. */
  mosse: number;
  spiegazione: string;
  idee: string[];
  /** Segni sulla posizione iniziale, stesso formato del repertorio ("g:c4f7 r@c4"). */
  segni?: string;
};

export const FINALI: Finale[] = [
  {
    id: 'donna-re',
    titolo: 'Donna e Re contro Re',
    gruppo: 'Matti di base',
    colore: 'w',
    fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1',
    obiettivo: 'matto',
    mosse: 15,
    spiegazione: 'Il matto più importante da sapere a memoria. La Donna chiude il Re nero in una scatola sempre più piccola, poi arriva il tuo Re per aiutare.',
    idee: [
      'Metti la Donna a una mossa di Cavallo dal Re nero: lo chiude senza dargli scacco.',
      'Ogni volta che il Re nero si sposta, stringi la scatola restando a "salto di Cavallo".',
      'Quando il Re nero è sul bordo, fermati: porta il tuo Re vicino, poi dai matto.',
      'Attenzione allo stallo: prima di ogni mossa controlla che il Re nero abbia almeno una casa libera.',
    ],
    segni: 'b:d1f3 b:e1e3',
  },
  {
    id: 'torre-re',
    titolo: 'Torre e Re contro Re',
    gruppo: 'Matti di base',
    colore: 'w',
    fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1',
    obiettivo: 'matto',
    mosse: 25,
    spiegazione: 'Più lento della Donna: la Torre taglia il Re nero lungo una traversa o colonna, il tuo Re lo spinge indietro con l\'opposizione.',
    idee: [
      'La Torre taglia: con Ra4 il Re nero non può scendere sotto la quinta traversa.',
      'Porta il tuo Re davanti a quello nero (opposizione: Re di fronte con una casa in mezzo).',
      'Quando i Re sono in opposizione, lo scacco di Torre spinge il Re nero indietro di una traversa.',
      'Se il Re nero non è in opposizione, fai una mossa d\'attesa con la Torre lungo la stessa traversa.',
    ],
    segni: 'g:a1a4 r@e5 b:e1e3',
  },
  {
    id: 'due-torri',
    titolo: 'Le due Torri (la scala)',
    gruppo: 'Matti di base',
    colore: 'w',
    fen: '8/8/8/3k4/8/8/8/R3K2R w - - 0 1',
    obiettivo: 'matto',
    mosse: 12,
    spiegazione: 'Le Torri salgono a scala: una taglia una traversa, l\'altra dà scacco su quella successiva. Il Re non serve.',
    idee: [
      'Una Torre controlla una traversa, l\'altra dà scacco su quella più avanti: il Re nero deve indietreggiare.',
      'Tieni le Torri lontane dal Re nero: se si avvicina, spostale sull\'altro lato della scacchiera.',
      'Ripeti finché il Re nero è sull\'ottava traversa: lì lo scacco è matto.',
    ],
    segni: 'g:h1h4 g:a1a5 r@d5',
  },
  {
    id: 'pedone-opposizione',
    titolo: 'Re e pedone: vincere con l\'opposizione',
    gruppo: 'Re e pedone',
    colore: 'w',
    fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
    obiettivo: 'promuovi',
    mosse: 10,
    spiegazione: 'Con il Re in sesta traversa davanti al pedone vinci sempre: il Re apre la strada, il pedone segue.',
    idee: [
      'Il Re va davanti al pedone, non dietro: è lui che conquista le case di promozione.',
      'Usa l\'opposizione: se il Re nero si mette davanti, spostati di lato per aggirarlo.',
      'Spingi il pedone solo quando il tuo Re controlla la casa davanti a lui.',
      'Attento allo stallo con il pedone in settima e il Re nero in ottava.',
    ],
    segni: 'g:e6d6 g@d7 g@e7 g@f7',
  },
  {
    id: 'quadrato',
    titolo: 'La regola del quadrato',
    gruppo: 'Re e pedone',
    colore: 'w',
    fen: '7K/8/8/8/P7/8/8/6k1 w - - 0 1',
    obiettivo: 'promuovi',
    mosse: 6,
    spiegazione: 'Il Re nero riesce a fermare il pedone solo se entra nel "quadrato" del pedone. Qui è troppo lontano: corri!',
    idee: [
      'Il quadrato: dal pedone fino alla promozione, e altrettante case di lato (qui a4-a8-e8-e4).',
      'Se il Re avversario, con la mossa, non può entrare nel quadrato, il pedone promuove da solo.',
      'Non perdere tempo con il Re: spingi subito il pedone.',
    ],
    segni: 'b:a4a8 b@a4 b@a8 b@e8 b@e4 r@g1',
  },
  {
    id: 'lucena',
    titolo: 'Posizione di Lucena (costruire il ponte)',
    gruppo: 'Torre e pedone',
    colore: 'w',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    obiettivo: 'promuovi',
    mosse: 12,
    spiegazione: 'Il finale di Torre più importante da vincere. Il tuo Re è chiuso davanti al pedone: si libera con uno scacco e poi la Torre fa da "ponte" contro gli scacchi laterali.',
    idee: [
      'Prima taglia il Re nero dalla colonna del pedone: Rd1+ lo allontana.',
      'Porta la Torre in quarta traversa (Rd4): sarà il ponte.',
      'Esci col Re e, quando la Torre nera dà scacchi, ripara il Re dietro la tua Torre in quarta.',
      'Libero dagli scacchi, il pedone promuove.',
    ],
    segni: 'g:c1d1 b:d1d4 g@d4 r:a2a8',
  },
  {
    id: 'philidor',
    titolo: 'Difesa di Philidor',
    gruppo: 'Torre e pedone',
    colore: 'b',
    fen: '4k3/1R6/r7/4PK2/8/8/8/8 b - - 0 1',
    obiettivo: 'patta',
    mosse: 20,
    spiegazione: 'Il modo più semplice per pareggiare Torre contro Torre e pedone. La tua Torre resta in sesta traversa e impedisce al Re bianco di avanzare.',
    idee: [
      'Torre in sesta traversa (qui la tua terza dal fondo): il Re bianco non può salire in sesta.',
      'Il tuo Re resta davanti al pedone, sulla casa di promozione.',
      'Quando il pedone avanza in sesta, la tua Torre va in fondo e dà scacchi da dietro: il Re bianco non ha riparo.',
      'Non lasciare la sesta traversa prima che il pedone ci arrivi.',
    ],
    segni: 'b:a6h6 g@e8 r@e6 r@f6',
  },
  {
    id: 'pedone-difesa',
    titolo: 'Re contro Re e pedone: la mossa giusta',
    gruppo: 'Re e pedone',
    colore: 'b',
    fen: '8/4k3/4P3/4K3/8/8/8/8 b - - 0 1',
    obiettivo: 'patta',
    mosse: 10,
    spiegazione: 'Una sola mossa pareggia: il Re torna sulla casa davanti al pedone. Le altre perdono. Poi tieni l\'opposizione fino allo stallo.',
    idee: [
      'Il Re difensore va davanti al pedone, sulla casa di promozione o subito davanti.',
      'Quando il Re bianco si mette di fronte al tuo, prendi l\'opposizione: rispondi mettendoti di fronte a lui.',
      'Se il pedone arriva in settima con scacco, vai nell\'angolo davanti a lui: il Bianco rischia lo stallo.',
    ],
    segni: 'g:e7e8 g@e8 r:e6e7',
  },
];

/** Soglia di posizione vinta per chi muove: circa +3 o matto (il motore lite senza tablebase non vede sempre il matto). */
export const SOGLIA_VINTA = 0.75;
/** Sotto questa probabilità la patta è persa (circa -3). */
export const SOGLIA_PATTA = 0.25;

export function trovaFinale(id: string) {
  return FINALI.find((f) => f.id === id) ?? null;
}

export type EsitoFinale = { stato: 'continua' | 'riuscito' | 'fallito'; messaggio: string | null };

/**
 * Esito dopo una mossa di Mauro. `fen` è la posizione dopo la mossa, `prob` la probabilità di vittoria di Mauro
 * secondo il motore (null se la partita è finita), `promozione` se la mossa era una promozione, `mosseFatte` le sue mosse finora.
 * Funzione pura: la usano la pagina e i test.
 */
export function esitoDopoMiaMossa(
  f: Finale,
  stato: { matto: boolean; patta: boolean; stallo: boolean },
  prob: number | null,
  promozione: boolean,
  mosseFatte: number
): EsitoFinale {
  if (stato.matto) return { stato: 'riuscito', messaggio: 'Scacco matto!' };
  if (stato.patta) {
    if (f.obiettivo === 'patta') return { stato: 'riuscito', messaggio: 'Patta raggiunta.' };
    return { stato: 'fallito', messaggio: stato.stallo ? 'Stallo! Il Re avversario non ha mosse: è patta.' : 'La partita è patta.' };
  }
  if (prob !== null) {
    if (f.obiettivo === 'patta' && prob < SOGLIA_PATTA) return { stato: 'fallito', messaggio: 'Con questa mossa la posizione diventa persa. Torna indietro e riprova.' };
    if (f.obiettivo !== 'patta' && prob < SOGLIA_VINTA) return { stato: 'fallito', messaggio: 'Con questa mossa la vittoria sfuma. Torna indietro e riprova.' };
    if (f.obiettivo === 'promuovi' && promozione) return { stato: 'riuscito', messaggio: 'Pedone promosso e posizione vinta!' };
  }
  if (mosseFatte >= f.mosse) {
    if (f.obiettivo === 'patta') return { stato: 'riuscito', messaggio: `Hai tenuto la patta per ${f.mosse} mosse.` };
    return { stato: 'fallito', messaggio: `Mosse finite: l'obiettivo era in ${f.mosse} mosse. Riprova più diretto.` };
  }
  return { stato: 'continua', messaggio: null };
}

/** Esito dopo la risposta del motore (Mauro può subire matto o una patta). */
export function esitoDopoRisposta(f: Finale, stato: { matto: boolean; patta: boolean }): EsitoFinale {
  if (stato.matto) return { stato: 'fallito', messaggio: 'Hai subito scacco matto.' };
  if (stato.patta) return f.obiettivo === 'patta' ? { stato: 'riuscito', messaggio: 'Patta raggiunta.' } : { stato: 'fallito', messaggio: 'La partita è patta.' };
  return { stato: 'continua', messaggio: null };
}
