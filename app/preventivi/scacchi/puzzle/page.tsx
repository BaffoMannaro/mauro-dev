import PuzzleScacchi from '@/components/scacchi/PuzzleScacchi';
import { puzzleDaFare, riepilogoPuzzle, sincronizzaPuzzle } from '@/lib/scacchi/puzzle';

export const metadata = { title: 'Puzzle · Scacchi' };
export const dynamic = 'force-dynamic';

export default async function PuzzlePage() {
  await sincronizzaPuzzle();
  const [puzzle, riepilogo] = await Promise.all([puzzleDaFare(20), riepilogoPuzzle()]);
  return <PuzzleScacchi puzzle={puzzle} riepilogo={riepilogo} />;
}
