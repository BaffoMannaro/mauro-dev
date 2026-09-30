import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ensureFattureXmlSchema } from '@/lib/schema';
import { parseFattura } from '@/lib/fattura/parse';
import { salvaFattura } from '@/lib/fattura/server';

// Salva (o aggiorna, se numero+anno esistono già) una fattura XML nell'archivio.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  await ensureFattureXmlSchema();
  const { xml, con_logo } = await req.json().catch(() => ({}));

  let f;
  try {
    f = parseFattura(String(xml ?? ''));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const salvata = await salvaFattura(f, String(xml), con_logo !== false);
  return NextResponse.json(salvata);
}
