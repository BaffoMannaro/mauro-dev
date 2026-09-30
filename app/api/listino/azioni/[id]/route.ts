import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { eliminaAzione, modificaAzione } from '@/lib/listino-db';

// Rinomina / ricategorizza un'azione, oppure la unisce in un'altra (unisci_in).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  try {
    return NextResponse.json(await modificaAzione(Number(id), await req.json()));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

// Elimina l'azione: le sue voci tornano da classificare.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { id } = await params;
  await eliminaAzione(Number(id));
  return NextResponse.json({ ok: true });
}
