import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { resetPreventivo } from '@/lib/reset-preventivo';

// Reset di aperture del link e/o accettazione di un preventivo (solo gestionale).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  const { aperture, accettazione } = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await resetPreventivo(Number(id), { aperture: !!aperture, accettazione: !!accettazione }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
