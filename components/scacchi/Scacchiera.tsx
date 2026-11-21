'use client';

import { useMemo, useState } from 'react';
import { Chessboard, defaultPieces, type PieceRenderObject } from 'react-chessboard';
import { srcPezzo, useSetPezzi } from './TemaScacchi';
import { Chess, type Square } from 'chess.js';
import { COLORI, SIMBOLI, type Classificazione } from '@/lib/scacchi/classifica';

// Colori ispirati alla scacchiera verde classica.
export const CASA_CHIARA = '#ebecd0';
export const CASA_SCURA = '#739552';
const EVIDENZA = 'rgba(255, 255, 51, 0.5)';

export type Freccia = { da: string; a: string; colore?: string };

type Props = {
  fen: string;
  orientamento?: 'white' | 'black';
  /** Ultima mossa giocata (uci), evidenziata. */
  ultima?: string | null;
  frecce?: Freccia[];
  /** Badge di classificazione sulla casa d'arrivo dell'ultima mossa. */
  badge?: Classificazione | null;
  /** Se presente, la scacchiera è giocabile: riceve la mossa in uci e restituisce true se accettata. */
  onMossa?: (uci: string) => boolean;
  /** Colore che può muovere (default: chi ha il tratto). */
  muove?: 'w' | 'b' | null;
  id?: string;
};

export default function Scacchiera({ fen, orientamento = 'white', ultima, frecce = [], badge, onMossa, muove, id = 'scacchiera' }: Props) {
  const [selezionata, setSelezionata] = useState<string | null>(null);
  const [promozione, setPromozione] = useState<{ da: string; a: string } | null>(null);

  const setPezzi = useSetPezzi();
  const pezzi = useMemo<PieceRenderObject>(() => {
    if (setPezzi === 'classico') return defaultPieces;
    const out: PieceRenderObject = {};
    for (const k of Object.keys(defaultPieces)) {
      const src = srcPezzo(setPezzi, k)!;
      // eslint-disable-next-line @next/next/no-img-element
      out[k] = () => <img src={src} alt={k} draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />;
    }
    return out;
  }, [setPezzi]);
  const gioco = useMemo(() => new Chess(fen), [fen]);
  const turno = gioco.turn();
  const puoMuovere = !!onMossa && (muove === undefined ? true : muove === turno);

  const legali = useMemo(() => {
    if (!selezionata || !puoMuovere) return [] as { to: string; capture: boolean }[];
    return gioco
      .moves({ square: selezionata as Square, verbose: true })
      .map((m) => ({ to: m.to, capture: !!m.captured }));
  }, [gioco, selezionata, puoMuovere]);

  const scacco = useMemo(() => {
    if (!gioco.inCheck()) return null;
    for (const riga of gioco.board()) for (const c of riga) if (c && c.type === 'k' && c.color === turno) return c.square;
    return null;
  }, [gioco, turno]);

  function prova(da: string, a: string): boolean {
    if (!onMossa) return false;
    const m = gioco.moves({ square: da as Square, verbose: true }).find((x) => x.to === a);
    if (!m) return false;
    if (m.promotion) {
      setPromozione({ da, a });
      return true;
    }
    setSelezionata(null);
    return onMossa(da + a);
  }

  const stili: Record<string, React.CSSProperties> = {};
  if (ultima) {
    stili[ultima.slice(0, 2)] = { background: EVIDENZA };
    stili[ultima.slice(2, 4)] = { background: EVIDENZA };
  }
  if (selezionata) stili[selezionata] = { background: EVIDENZA };
  if (scacco) stili[scacco] = { ...stili[scacco], background: 'radial-gradient(circle, rgba(255,0,0,.85) 0%, rgba(231,0,0,.5) 40%, transparent 75%)' };
  const legaliMap = new Map(legali.map((l) => [l.to, l.capture]));
  const badgeCasa = badge && ultima ? ultima.slice(2, 4) : null;

  return (
    <div className="relative select-none" style={{ touchAction: 'none' }}>
      <Chessboard
        options={{
          id,
          position: fen,
          boardOrientation: orientamento,
          lightSquareStyle: { backgroundColor: CASA_CHIARA },
          darkSquareStyle: { backgroundColor: CASA_SCURA },
          pieces: pezzi,
          // Coordinate come sulla scacchiera verde di chess.com: grassetto, colore della casa opposta.
          lightSquareNotationStyle: { color: CASA_SCURA, fontWeight: 700 },
          darkSquareNotationStyle: { color: CASA_CHIARA, fontWeight: 700 },
          alphaNotationStyle: { fontSize: 'clamp(9px, 1.5vw, 15px)', position: 'absolute', bottom: '2%', right: '4%' },
          numericNotationStyle: { fontSize: 'clamp(9px, 1.5vw, 15px)', position: 'absolute', top: '2%', left: '4%' },
          boardStyle: { borderRadius: 4, overflow: 'hidden' },
          dropSquareStyle: { boxShadow: 'inset 0 0 0 4px rgba(255,255,255,.65)' },
          animationDurationInMs: 160,
          allowDragging: puoMuovere,
          canDragPiece: ({ piece }) => puoMuovere && piece.pieceType[0] === turno,
          arrows: frecce.map((f) => ({ startSquare: f.da, endSquare: f.a, color: f.colore ?? 'rgba(255,170,0,.8)' })),
          clearArrowsOnPositionChange: true,
          onPieceDrop: ({ sourceSquare, targetSquare }) => (targetSquare ? prova(sourceSquare, targetSquare) : false),
          onSquareClick: ({ square, piece }) => {
            if (!puoMuovere) return;
            if (selezionata && legaliMap.has(square)) {
              prova(selezionata, square);
              return;
            }
            if (piece && piece.pieceType[0] === turno) setSelezionata(square === selezionata ? null : square);
            else setSelezionata(null);
          },
          onPieceDrag: ({ square }) => {
            if (square) setSelezionata(square);
          },
          squareRenderer: ({ square, children }) => (
            <div style={{ width: '100%', height: '100%', position: 'relative', ...stili[square] }}>
              {children}
              {legaliMap.has(square) && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: legaliMap.get(square)
                      ? 'radial-gradient(transparent 0%, transparent 79%, rgba(0,0,0,.14) 80%)'
                      : 'radial-gradient(rgba(0,0,0,.14) 19%, transparent 20%)',
                  }}
                />
              )}
              {badgeCasa === square && badge && (
                <span
                  className="absolute -top-[14%] -right-[14%] z-10 flex items-center justify-center rounded-full text-white font-bold shadow"
                  style={{ width: '42%', height: '42%', background: COLORI[badge], fontSize: 'clamp(8px, 1.6vw, 15px)' }}
                  title={badge}
                >
                  {SIMBOLI[badge] || (badge === 'libro' ? '▤' : '✓')}
                </span>
              )}
            </div>
          ),
        }}
      />
      {promozione && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50" onClick={() => setPromozione(null)}>
          <div className="flex gap-2 rounded-lg bg-[#262421] p-3" onClick={(e) => e.stopPropagation()}>
            {(['q', 'r', 'b', 'n'] as const).map((p) => (
              <button
                key={p}
                className="h-14 w-14 rounded bg-[#3c3a37] p-1 hover:bg-[#81b64c]"
                onClick={() => {
                  const { da, a } = promozione;
                  setPromozione(null);
                  setSelezionata(null);
                  onMossa?.(da + a + p);
                }}
              >
                {pezzi[`${turno}${p.toUpperCase()}`]?.()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
