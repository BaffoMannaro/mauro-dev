import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { eliminaPartita, impostaColore, leggiPartita, salvaReview } from '@/lib/scacchi/db';
import type { Review } from '@/lib/scacchi/partita';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const p = await leggiPartita(Number((await params).id));
  if (!p) return NextResponse.json({ error: 'Non trovata' }, { status: 404 });
  return NextResponse.json(p);
}

// { review } salva l'analisi del motore fatta nel browser; { colore } corregge il colore giocato.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  try {
    if (body.colore === 'w' || body.colore === 'b') await impostaColore(id, body.colore);
    if (body.review && Array.isArray(body.review.mosse)) await salvaReview(id, body.review as Review);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await auth())) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await eliminaPartita(Number((await params).id));
  return NextResponse.json({ ok: true });
}
