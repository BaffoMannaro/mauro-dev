import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';
import { parseFattura } from '@/lib/fattura/parse';
import { rispostaPdf } from '@/lib/fattura/server';

// PDF di una fattura in archivio. Accessibile all'admin e al cliente a cui è intestata
// (dal portale), sempre rigenerato dall'XML salvato.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await sql`SELECT xml, cliente_id, con_logo FROM fatture WHERE id = ${id}`;
  if (!row?.xml) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const admin = await auth();
  if (!admin) {
    const token = req.cookies.get(CLIENT_COOKIE)?.value;
    const cliente = token ? await verifyClientToken(token) : null;
    if (!cliente || cliente.scope !== 'session' || cliente.cid !== row.cliente_id) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
  }

  const logoParam = req.nextUrl.searchParams.get('logo');
  const logo = logoParam === null ? row.con_logo !== false : logoParam !== '0';
  return rispostaPdf(parseFattura(row.xml), logo);
}
