import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  eliminaIntervento,
  eliminaLavoro,
  ErroreCanone,
  impostaCanone,
  impostaStatoRichiesta,
  registraIntervento,
  salvaLavoro,
  stimaRichiesta,
  type StatoLavoro,
  type StatoRichiesta,
} from '@/lib/canone';
import { parseOre } from '@/lib/canone-calcolo';
import { notificaStima } from '@/lib/canone-email';

const num = (v: unknown) => (v === '' || v == null ? null : Number(v));
const str = (v: unknown) => (v === '' || v == null ? null : String(v));

// Canone ore di un cliente (lato admin): un'unica route con { azione, ... }.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

  const cid = Number((await params).id);
  const b = await req.json().catch(() => ({}));

  try {
    switch (b.azione) {
      case 'canone':
        await impostaCanone(cid, {
          ore_mese: Number(b.ore_mese),
          prezzo_mese: Number(b.prezzo_mese),
          tariffa_extra: Number(b.tariffa_extra),
          inizio: String(b.inizio ?? ''),
          fine: str(b.fine),
          riporto_mesi: b.riporto_mesi != null ? Number(b.riporto_mesi) : 1,
          siti: Array.isArray(b.siti) ? b.siti.map(String).filter(Boolean) : undefined,
        });
        break;
      case 'intervento': {
        const minuti = parseOre(String(b.ore ?? ''));
        if (!minuti) throw new ErroreCanone('Durata non valida: usa 1:30, 1,5 o 45m');
        await registraIntervento(cid, {
          data: String(b.data ?? ''),
          minuti,
          descrizione: String(b.descrizione ?? ''),
          sito: str(b.sito),
          richiesto_da: str(b.richiesto_da),
          fuori_canone: !!b.fuori_canone,
          richiesta_id: num(b.richiesta_id),
          lavoro_id: num(b.lavoro_id),
        });
        if (b.completa_richiesta && b.richiesta_id) await impostaStatoRichiesta(cid, Number(b.richiesta_id), 'completata');
        break;
      }
      case 'elimina_intervento':
        await eliminaIntervento(cid, Number(b.id));
        break;
      case 'stima': {
        const r = await stimaRichiesta(cid, Number(b.id), {
          ore_stimate: Number(String(b.ore_stimate).replace(',', '.')),
          risposta: str(b.risposta),
          consegna_prevista: str(b.consegna_prevista),
        });
        await notificaStima(cid, r);
        break;
      }
      case 'stato_richiesta':
        await impostaStatoRichiesta(cid, Number(b.id), b.stato as StatoRichiesta);
        break;
      case 'lavoro':
        await salvaLavoro(cid, {
          id: b.id ? Number(b.id) : undefined,
          titolo: b.titolo,
          sito: str(b.sito),
          stato: (b.stato || undefined) as StatoLavoro | undefined,
          inizio: str(b.inizio),
          consegna_prevista: str(b.consegna_prevista),
          ore_stimate: b.ore_stimate === undefined ? undefined : num(String(b.ore_stimate).replace(',', '.')),
          attesa_cliente: str(b.attesa_cliente),
          preventivo_id: b.preventivo_id === undefined ? undefined : num(b.preventivo_id),
        });
        break;
      case 'elimina_lavoro':
        await eliminaLavoro(cid, Number(b.id));
        break;
      default:
        return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof ErroreCanone) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}
