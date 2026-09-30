import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { parseFattura } from '@/lib/fattura/parse';
import { renderFatturaHtml, nomeFilePdf } from '@/lib/fattura/html';

// Riceve l'XML FatturaPA (testo) e restituisce la copia di cortesia brandizzata in PDF.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  let fattura;
  try {
    fattura = parseFattura(await req.text());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const pdfRes = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: renderFatturaHtml(fattura),
      format: 'A4',
      margin: '0',
    }),
  });

  if (!pdfRes.ok) {
    console.error('PDFShift error:', await pdfRes.text());
    return NextResponse.json({ error: 'Generazione PDF non riuscita' }, { status: 500 });
  }

  return new NextResponse(await pdfRes.arrayBuffer(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeFilePdf(fattura)}"`,
    },
  });
}
