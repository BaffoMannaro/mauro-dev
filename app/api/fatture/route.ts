import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseFattura } from '@/lib/fattura/parse';
import { preparaArchivio, salvaFattura } from '@/lib/fattura/server';

// Salva (o aggiorna, se numero+anno esistono già) una fattura XML nell'archivio.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await preparaArchivio();
  const { xml, con_logo, preventivo_id } = await req.json().catch(() => ({}));

  let f;
  try {
    f = parseFattura(String(xml ?? ''));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const salvata = await salvaFattura(
    f, String(xml), con_logo !== false,
    preventivo_id === undefined ? undefined : preventivo_id === null ? null : Number(preventivo_id)
  );
  return NextResponse.json(salvata);
}
