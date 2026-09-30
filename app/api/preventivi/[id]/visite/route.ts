import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { visiteDelPreventivo } from '@/lib/visite';

// Aperture del link pubblico di un preventivo: riepilogo + ultime visite.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  return NextResponse.json(await visiteDelPreventivo(Number(id)));
}
