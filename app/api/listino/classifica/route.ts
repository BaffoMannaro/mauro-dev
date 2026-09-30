import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { classificaVoci } from '@/lib/listino-db';

// Assegna voci (per descrizione) a un'azione; azione_id null le rimette da classificare.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  const { descrizioni, azione_id } = await req.json().catch(() => ({}));
  if (!Array.isArray(descrizioni)) return NextResponse.json({ error: 'descrizioni mancanti' }, { status: 400 });
  try {
    const n = await classificaVoci(descrizioni.map(String), azione_id == null ? null : Number(azione_id));
    return NextResponse.json({ ok: true, voci: n });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
