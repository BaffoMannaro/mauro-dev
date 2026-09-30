import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import sql from '@/lib/db';
import { verifyClientToken, CLIENT_COOKIE } from '@/lib/client-auth';
import { parseFattura } from '@/lib/fattura/parse';
import { rispostaPdf } from '@/lib/fattura/server';
import { verifica } from '@/lib/mcp/oauth';

// PDF di una fattura in archivio. Accessibile all'admin, al cliente a cui è intestata
// (dal portale) e con un link firmato dal connettore Claude. Sempre rigenerato dall'XML salvato.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [row] = await sql`SELECT xml, cliente_id, con_logo FROM fatture WHERE id = ${id}`;
  if (!row?.xml) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Link firmato generato dal connettore Claude: valido senza login per 24 ore.
  const t = req.nextUrl.searchParams.get('t');
  const firmato = t ? await verifica('download', t) : null;
  const admin = (firmato && firmato.fid === Number(id)) || (await auth());
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
