import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ErrorePagamento, preparaArchivio, registraPagamento, statoPagamenti } from '@/lib/fattura/server';

// Pagamenti (anche parziali) di una fattura: elenco con incassato/residuo/stato, e nuovo pagamento.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await preparaArchivio();
  const { id } = await params;
  const s = await statoPagamenti(id);
  return s ? NextResponse.json(s) : NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await preparaArchivio();
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  try {
    const s = await registraPagamento(id, {
      importo: Number(b.importo),
      data: typeof b.data === 'string' && b.data ? b.data : undefined,
      metodo: typeof b.metodo === 'string' ? b.metodo : null,
      nota: typeof b.nota === 'string' ? b.nota : null,
    });
    return NextResponse.json(s);
  } catch (e) {
    if (e instanceof ErrorePagamento) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
