import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

const SITE_URL =
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://maurodev.it');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const rows = await sql`SELECT oggetto, cliente_nome FROM preventivi WHERE token = ${token}`;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { oggetto, cliente_nome } = rows[0];

  const pdfRes = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${process.env.PDFSHIFT_API_KEY}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: `${SITE_URL}/p/${token}`,
      use_print: true,
      format: 'A4',
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
    }),
  });

  if (!pdfRes.ok) {
    const err = await pdfRes.text();
    console.error('PDFShift error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }

  const buffer = await pdfRes.arrayBuffer();

  const filename = `preventivo-${oggetto}-${cliente_nome}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat('.pdf');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
