import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { fattureDelPreventivo, preparaArchivio } from '@/lib/fattura/server';

// Fatture collegate a un preventivo, con riepilogo fatturato / incassato / da fatturare.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await preparaArchivio();
  const { id } = await params;
  try {
    return NextResponse.json(await fattureDelPreventivo(Number(id)));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}
