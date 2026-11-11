import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { eliminaPagamento, preparaArchivio } from '@/lib/fattura/server';

// Elimina un pagamento della fattura e restituisce lo stato aggiornato.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; pagamentoId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  await preparaArchivio();
  const { id, pagamentoId } = await params;
  const s = await eliminaPagamento(pagamentoId, id);
  return s ? NextResponse.json(s) : NextResponse.json({ error: 'Pagamento non trovato' }, { status: 404 });
}
