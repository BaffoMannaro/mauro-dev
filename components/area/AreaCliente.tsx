'use client';

// Area cliente: un'unica pagina con quattro tab (Home, Lavori, Ore, Pagamenti).
// Da desktop ogni tab sta in una finestra; le liste lunghe partono dalle ultime 5.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { euroCent } from '@/lib/formato';
import { calcFinanza } from '@/lib/preventivo-finance';
import { fmtMinuti, meseDi, meseSuccessivo, nomeMese } from '@/lib/canone-calcolo';
import type { DatiArea } from '@/lib/area-cliente';
import { pixelFont } from '@/lib/font-pixel';
import { Icona, Omino, type NomeIcona } from '@/components/pixel/Sprite';
import { AREA, Etichetta, LARGHEZZA, Tile, Titolo, type Area } from '@/components/pixel/Bento';
import {
  giorno, NuovaRichiesta, ore, Pagamenti, Regola, MonteOre, RegistroInterventi,
  soloMese, StimaDaApprovare, Storico, STATO_RICHIESTA, Timeline, VediTutti,
} from '@/components/area/pezzi';

export type TabArea = 'home' | 'lavori' | 'ore' | 'pagamenti';

const eur = euroCent;
const dataIt = (d: string | null) => (d ? giorno(d, true) : '');
/** Corpo di un riquadro: da desktop scorre dentro il riquadro, la pagina resta ferma. */
const corpo = 'flex-1 min-h-0 lg:overflow-y-auto px-scroll -mr-2 pr-2';

type Preventivo = DatiArea['preventivi'][number];

function statoProgetto(p: Preventivo): { label: string; area: Area } {
  if (p.lavoro_fine) return { label: 'Consegnato', area: 'fatto' };
  if (p.lavoro_inizio) return { label: 'In corso', area: 'lavori' };
  return { label: 'Da avviare', area: 'fumo' };
}

const STATO_PREVENTIVO: Record<string, { label: string; area: Area }> = {
  inviato: { label: 'Da valutare', area: 'azione' },
  accettato: { label: 'Accettato', area: 'fatto' },
  archiviato: { label: 'Concluso', area: 'fumo' },
  rifiutato: { label: 'Non accettato', area: 'fumo' },
};

export default function AreaCliente({
  dati,
  tab: tabIniziale = 'home',
  anteprima,
}: {
  dati: DatiArea;
  tab?: TabArea;
  /** Vista di Mauro dal gestionale: fascia di avviso al posto di "Esci", azioni disattivate. */
  anteprima?: { indietro: string };
}) {
  const router = useRouter();
  const { cliente, preventivi, fatture, canone, oggi } = dati;
  const bloccato = !!anteprima;
  const aggiorna = () => router.refresh();

  const [tab, setTab] = useState<TabArea>(canone || tabIniziale !== 'ore' ? tabIniziale : 'home');
  const [profilo, setProfilo] = useState(false);
  const vai = (t: TabArea) => {
    setTab(t);
    try {
      window.history.replaceState(null, '', `?tab=${t}`);
    } catch {}
  };

  // Cose che aspettano il cliente, in ordine di urgenza.
  const stime = canone?.richieste.filter((r) => r.stato === 'stimata') ?? [];
  const daAccettare = preventivi.filter((p) => p.stato === 'inviato');
  const attese = canone?.lavori.filter((l) => l.stato === 'attesa_cliente' && l.attesa_cliente) ?? [];
  const daPagare = fatture.filter((f) => f.stato !== 'pagata');
  const nAzioni = stime.length + daAccettare.length + attese.length + daPagare.length;

  const progetti = preventivi.filter((p) => p.stato === 'accettato' || p.stato === 'archiviato');
  const lavoriCanone = canone?.lavori ?? [];
  const inCorso = [
    ...lavoriCanone.filter((l) => l.stato === 'in_corso').map((l) => l.titolo),
    ...progetti.filter((p) => p.lavoro_inizio && !p.lavoro_fine).map((p) => p.oggetto),
  ];
  const finanza = useMemo(() => calcFinanza(preventivi as never), [preventivi]);

  const schede: { id: TabArea; label: string; icona: NomeIcona; area: Area }[] = [
    { id: 'home', label: 'Home', icona: 'casa', area: 'azione' },
    { id: 'lavori', label: 'Lavori', icona: 'bandiera', area: 'lavori' },
    ...(canone ? [{ id: 'ore' as const, label: 'Ore', icona: 'clessidra' as const, area: 'ore' as const }] : []),
    { id: 'pagamenti', label: 'Pagamenti', icona: 'moneta', area: 'soldi' },
  ];

  const esci = async () => {
    await fetch('/api/portale/esci', { method: 'POST' });
    window.location.href = '/accedi';
  };

  return (
    <div className={`${pixelFont.variable} px-tela text-chiaro min-h-dvh lg:h-dvh lg:overflow-hidden flex flex-col`}>
      {anteprima && (
        <div className="bg-ink-2 border-b-2 border-azione/50 shrink-0">
          <div className={`${LARGHEZZA} py-2 flex flex-wrap items-center justify-between gap-2 text-xs`}>
            <span className="flex items-center gap-2">
              <Icona nome="esclamativo" className="text-azione" />
              Anteprima: è l&apos;area che vede {cliente.nome}. I pulsanti sono disattivati.
            </span>
            <a href={anteprima.indietro} className="text-nebbia hover:text-chiaro hover:underline underline-offset-4">Torna alla scheda cliente</a>
          </div>
        </div>
      )}

      <header className="border-b-2 border-ink-3 bg-ink/80 backdrop-blur shrink-0">
        <div className={`${LARGHEZZA} h-14 flex items-center justify-between gap-4`}>
          <img src="/Logo.svg" alt="MAURO DEV" className="h-6 w-auto brightness-0 invert shrink-0" />
          <nav className="hidden sm:flex items-center gap-1" aria-label="Sezioni">
            {schede.map((s) => (
              <BottoneTab key={s.id} s={s} attiva={tab === s.id} badge={s.id === 'home' ? nAzioni : 0} onClick={() => vai(s.id)} />
            ))}
          </nav>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setProfilo(true)} className="text-sm text-nebbia hover:text-chiaro truncate max-w-48 underline-offset-4 hover:underline">
              {cliente.azienda || cliente.nome}
            </button>
            {!anteprima && (
              <button onClick={esci} className="text-xs text-fumo hover:text-chiaro shrink-0">Esci</button>
            )}
          </div>
        </div>
        <nav className="sm:hidden grid border-t-2 border-ink-3" style={{ gridTemplateColumns: `repeat(${schede.length}, 1fr)` }} aria-label="Sezioni">
          {schede.map((s) => (
            <button key={s.id} onClick={() => vai(s.id)} aria-current={tab === s.id ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 py-2 font-pixel text-[10px] ${tab === s.id ? `${AREA[s.area].testo} bg-ink-2` : 'text-fumo'}`}>
              <span className="relative">
                <Icona nome={s.icona} />
                {s.id === 'home' && nAzioni > 0 && <span className="absolute -top-1 -right-2 w-2 h-2 bg-azione" />}
              </span>
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={`${LARGHEZZA} w-full flex-1 min-h-0 py-4 sm:py-5`}>
        {tab === 'home' && (
          <div className="grid gap-3 sm:gap-4 lg:h-full grid-cols-2 lg:grid-cols-12 lg:grid-rows-[1fr_1fr_auto]">
            {/* Il riquadro principale: saluto e la cosa più importante del momento */}
            <Tile area={nAzioni ? 'azione' : 'fatto'} className="col-span-2 lg:col-span-6 lg:row-span-3">
              <div className="flex items-center gap-4 sm:gap-6 mb-5 shrink-0">
                <div className="relative shrink-0">
                  {nAzioni > 0 && (
                    <span className="absolute -top-4 -right-2 px-hop text-azione"><Icona nome="esclamativo" scala={3} /></span>
                  )}
                  <div className="sm:hidden"><Omino scala={4} alLavoro={inCorso.length > 0} /></div>
                  <div className="hidden sm:block"><Omino scala={6} alLavoro={inCorso.length > 0} /></div>
                </div>
                <div className="min-w-0">
                  <h1 className="font-pixel text-2xl sm:text-4xl leading-tight break-words">Ciao {cliente.nome.split(' ')[0]}</h1>
                  <p className="text-sm sm:text-base text-nebbia mt-2">
                    {nAzioni > 0
                      ? nAzioni === 1 ? "C'è una cosa per te." : `Ci sono ${nAzioni} cose per te.`
                      : inCorso.length > 0
                        ? <>Sto lavorando a <span className="text-lavori">{inCorso[0]}</span><span className="px-dots" /></>
                        : 'Tutto in ordine, non serve niente da parte tua.'}
                  </p>
                </div>
              </div>
              {nAzioni > 0 ? (
                <div className={corpo}>
                  <PerTe stime={stime} preventivi={daAccettare} attese={attese} fatture={daPagare} bloccato={bloccato} onFatto={aggiorna} />
                </div>
              ) : (
                <div className="flex-1 grid place-items-center text-center bg-ink-3/50 px-notch-sm p-6">
                  <div>
                    <Icona nome="spunta" scala={6} className="text-fatto mx-auto mb-4" />
                    <p className="font-pixel text-lg text-fatto">Tutto a posto</p>
                    <p className="text-sm text-nebbia mt-1">Quando arriva un preventivo, una stima o una fattura, la trovi qui.</p>
                  </div>
                </div>
              )}
            </Tile>

            {/* Medio: ore (chi ha il canone) o lavori */}
            {canone?.corrente ? (
              <TileLink area="ore" icona="clessidra" titolo={`Ore di ${soloMese(canone.corrente.mese)}`} vai="Ore" onClick={() => vai('ore')}
                className="col-span-2 lg:col-span-6">
                <Grande area="ore" valore={fmtMinuti(canone.corrente.rimaste)} sotto={`rimaste su ${fmtMinuti(canone.corrente.incluse + canone.corrente.riportate)}`} />
                <BarraPixel pieni={canone.corrente.usate} totale={canone.corrente.incluse + canone.corrente.riportate} colore="bg-ore" />
              </TileLink>
            ) : (
              <TileLavori n={inCorso.length} primo={inCorso[0]} onClick={() => vai('lavori')} />
            )}

            {/* Medio: lavori (chi ha il canone) o soldi */}
            {canone ? (
              <TileLavori n={inCorso.length} primo={inCorso[0]} prossima={prossimaConsegna(lavoriCanone, oggi)} onClick={() => vai('lavori')} />
            ) : (
              <TileLink area="soldi" icona="moneta" titolo="Da versare" vai="Pagamenti" onClick={() => vai('pagamenti')} className="col-span-2 lg:col-span-6">
                <Grande area="soldi" valore={eur(finanza.daDare)} sotto={`su ${eur(finanza.totale)} di lavori`} />
                <BarraPixel pieni={finanza.ricevuto} totale={finanza.totale} colore="bg-fatto" />
              </TileLink>
            )}

            {/* Piccoli */}
            {canone ? (
              <>
                <TilePiccolo area="soldi" label="Da versare" valore={eur(finanza.daDare)} onClick={() => vai('pagamenti')} />
                <TilePiccolo area="azione" label="Ti serve qualcosa?" valore="Chiedimi" onClick={() => vai('ore')} />
              </>
            ) : (
              <>
                <TilePiccolo area="lavori" label="Preventivi" valore={String(preventivi.length)} onClick={() => vai('pagamenti')} />
                <TilePiccolo area="soldi" label="Fatture da pagare" valore={String(daPagare.length)} onClick={() => vai('pagamenti')} />
              </>
            )}
          </div>
        )}

        {tab === 'lavori' && (
          <div className={`grid gap-3 sm:gap-4 lg:h-full grid-cols-1 ${lavoriCanone.length && progetti.length ? 'lg:grid-rows-[auto_minmax(0,1fr)]' : ''}`}>
            {lavoriCanone.length > 0 && (
              <Tile area="lavori">
                <Titolo area="lavori" icona="bandiera" destra={<span className="text-xs text-fumo">Le consegne sono stime: se cambiano, le aggiorno qui.</span>}>
                  Lavori e consegne
                </Titolo>
                <div className={corpo}><Timeline lavori={lavoriCanone} oggi={oggi} /></div>
              </Tile>
            )}
            {(progetti.length > 0 || lavoriCanone.length === 0) && (
              <Tile area="lavori">
                <Titolo area="lavori" icona="registro">Progetti</Titolo>
                <div className={corpo}><Progetti progetti={progetti} /></div>
              </Tile>
            )}
          </div>
        )}

        {tab === 'ore' && canone && (
          <div className="grid gap-3 sm:gap-4 lg:h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-12 lg:grid-rows-2">
            <Tile area="ore" className="lg:col-span-5">
              {canone.corrente ? (
                <>
                  <Titolo area="ore" icona="clessidra">Ore di {soloMese(canone.corrente.mese)}</Titolo>
                  <div className={corpo}>
                    <MonteOre mese={canone.corrente} />
                    <FineMese mese={canone.corrente} oggi={oggi} tariffa={canone.canone.tariffa_extra} />
                  </div>
                </>
              ) : (
                <>
                  <Titolo area="ore" icona="clessidra">Monte ore</Titolo>
                  <p className="text-sm text-nebbia">Il canone parte da {nomeMese(meseDi(canone.canone.inizio))}: da quel mese trovi qui le ore.</p>
                </>
              )}
            </Tile>
            <Tile area="fumo" className="lg:col-span-3">
              <Titolo area="fumo" icona="calendario">Mese per mese</Titolo>
              <div className={corpo}>
                {canone.mesi.length > 0 ? <Storico mesi={canone.mesi} /> : <p className="text-sm text-nebbia">Lo storico parte dal primo mese di canone.</p>}
              </div>
            </Tile>
            <Tile area="azione" className="md:col-span-2 lg:col-span-4 lg:row-span-2">
              <Titolo area="azione" icona="fumetto">Chiedimi qualcosa</Titolo>
              <div className={corpo}>
                <p className="text-xs text-fumo mb-3">Facoltativo: mail e messaggi vanno benissimo. Da qui ti rispondo con una stima in ore prima di partire.</p>
                <NuovaRichiesta siti={canone.canone.siti} bloccato={bloccato} onFatto={aggiorna} />
                <RichiesteAperte richieste={canone.richieste.filter((r) => r.stato === 'nuova' || r.stato === 'approvata')} />
              </div>
            </Tile>
            <Tile area="ore" className="md:col-span-2 lg:col-span-8">
              <div className={corpo}>
                <RegistroInterventi interventi={canone.interventi} siti={canone.canone.siti} meseCorrente={meseDi(oggi)} />
              </div>
            </Tile>
          </div>
        )}

        {tab === 'pagamenti' && (
          <div className="grid gap-3 sm:gap-4 lg:h-full grid-cols-1 lg:grid-cols-12 lg:grid-rows-2">
            <Tile area="soldi" className="lg:col-span-4 lg:row-span-2">
              <Titolo area="soldi" icona="moneta">Riepilogo</Titolo>
              <div className={corpo}>
                <Grande area="soldi" valore={eur(finanza.daDare)} sotto="ancora da versare per i progetti" />
                <BarraPixel pieni={finanza.ricevuto} totale={finanza.totale} colore="bg-fatto" />
                <dl className="flex flex-col gap-1.5 text-sm mt-4">
                  <Riga label="Già versato" valore={eur(finanza.ricevuto)} colore="text-fatto" />
                  <Riga label="Totale progetti" valore={eur(finanza.totale)} />
                </dl>
                {canone && canone.pagamenti.length > 0 && (
                  <div className="mt-6">
                    <p className="font-pixel text-xs text-nebbia mb-2">Da pagare</p>
                    <Pagamenti pagamenti={canone.pagamenti} />
                  </div>
                )}
              </div>
            </Tile>
            <Tile area="soldi" className="lg:col-span-8">
              <Titolo area="soldi" icona="registro">Fatture</Titolo>
              <div className={corpo}><Fatture fatture={fatture} /></div>
            </Tile>
            <Tile area="lavori" className="lg:col-span-8">
              <Titolo area="lavori" icona="registro">Preventivi</Titolo>
              <div className={corpo}><Preventivi preventivi={preventivi} /></div>
            </Tile>
          </div>
        )}
      </main>

      {profilo && <Profilo dati={dati} onChiudi={() => setProfilo(false)} />}
    </div>
  );
}

// ── Intestazione ──

function BottoneTab({ s, attiva, badge, onClick }: { s: { label: string; icona: NomeIcona; area: Area }; attiva: boolean; badge: number; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-current={attiva ? 'page' : undefined}
      className={`px-notch-sm flex items-center gap-2 font-pixel text-xs px-3 py-2 transition-colors ${
        attiva ? `bg-ink-3 ${AREA[s.area].testo}` : 'text-fumo hover:text-chiaro'
      }`}>
      <Icona nome={s.icona} />
      {s.label}
      {badge > 0 && <span className="bg-azione text-ink px-1.5 leading-4 text-[10px]">{badge}</span>}
    </button>
  );
}

// ── Home ──

function Grande({ area, valore, sotto }: { area: Area; valore: string; sotto: string }) {
  return (
    <div className="mb-3">
      <p className={`font-pixel text-3xl sm:text-4xl xl:text-5xl leading-none tabular-nums ${AREA[area].testo}`}>{valore}</p>
      <p className="text-sm text-nebbia mt-2">{sotto}</p>
    </div>
  );
}

/** 20 pixel: i pieni sono la parte usata (o versata). */
function BarraPixel({ pieni, totale, colore }: { pieni: number; totale: number; colore: string }) {
  const n = totale > 0 ? Math.min(20, Math.round((pieni / totale) * 20)) : 0;
  return (
    <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }} aria-hidden>
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className={`block h-3 px-pop ${i < n ? colore : 'bg-ink-4'}`} style={{ animationDelay: `${i * 25}ms` }} />
      ))}
    </div>
  );
}

function TileLink({ area, icona, titolo, vai, onClick, className = '', children }: {
  area: Area; icona: NomeIcona; titolo: string; vai: string; onClick: () => void; className?: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className={`group text-left px-notch bg-ink-2 hover:bg-ink-3 transition-colors p-4 sm:p-5 min-w-0 flex flex-col justify-between ${className}`}
      style={{ boxShadow: `inset 0 4px 0 ${AREA[area].var}` }}>
      <div className="flex items-center justify-between gap-2 mb-3 w-full">
        <span className="flex items-center gap-2.5 font-pixel text-[15px] leading-none">
          <span className={`grid place-items-center w-7 h-7 px-notch-sm ${AREA[area].tenue} ${AREA[area].testo}`}><Icona nome={icona} /></span>
          {titolo}
        </span>
        <span className={`font-pixel text-[11px] text-fumo group-hover:text-chiaro flex items-center gap-1`}>
          {vai} <span aria-hidden>&gt;</span>
        </span>
      </div>
      <div className="w-full">{children}</div>
    </button>
  );
}

function TileLavori({ n, primo, prossima, onClick }: { n: number; primo?: string; prossima?: { titolo: string; data: string } | null; onClick: () => void }) {
  return (
    <TileLink area="lavori" icona="bandiera" titolo="Lavori" vai="Lavori" onClick={onClick} className="col-span-2 lg:col-span-6">
      <Grande area="lavori" valore={String(n)} sotto={n === 1 ? `in corso: ${primo}` : n > 1 ? `in corso, tra cui ${primo}` : 'nessun lavoro in corso'} />
      {prossima && (
        <p className="text-sm text-nebbia flex flex-wrap items-center gap-x-2 gap-y-1">
          <Icona nome="bandiera" className="text-lavori" /> prossima consegna <span className="font-pixel text-chiaro">{giorno(prossima.data)}</span>
          <span className="truncate text-fumo">{prossima.titolo}</span>
        </p>
      )}
    </TileLink>
  );
}

function TilePiccolo({ area, label, valore, onClick }: { area: Area; label: string; valore: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left px-notch bg-ink-2 hover:bg-ink-3 transition-colors p-4 sm:p-5 min-w-0 flex flex-col justify-between lg:col-span-3"
      style={{ boxShadow: `inset 0 4px 0 ${AREA[area].var}` }}>
      <p className="text-xs text-fumo">{label}</p>
      <p className={`font-pixel text-xl sm:text-2xl leading-none mt-2 truncate ${AREA[area].testo}`}>{valore}</p>
    </button>
  );
}

function prossimaConsegna(lavori: NonNullable<DatiArea['canone']>['lavori'], oggi: string) {
  const l = lavori
    .filter((x) => x.stato !== 'completato' && x.consegna_prevista && x.consegna_prevista >= oggi)
    .sort((a, b) => a.consegna_prevista!.localeCompare(b.consegna_prevista!))[0];
  return l ? { titolo: l.titolo, data: l.consegna_prevista! } : null;
}

function PerTe({ stime, preventivi, attese, fatture, bloccato, onFatto }: {
  stime: NonNullable<DatiArea['canone']>['richieste'];
  preventivi: Preventivo[];
  attese: NonNullable<DatiArea['canone']>['lavori'];
  fatture: DatiArea['fatture'];
  bloccato: boolean;
  onFatto: () => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [tutte, setTutte] = useState(false);
  const rispondi = async (id: number, azione: 'accetta' | 'rifiuta') => {
    setBusy(id);
    try {
      const res = await fetch(`/api/portale/${azione}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ preventivo_id: id }) });
      if (res.ok) onFatto();
    } finally {
      setBusy(null);
    }
  };
  const btn2 = 'px-btn font-pixel text-[11px] px-3 py-2 bg-ink-4 text-nebbia';

  const voci: React.ReactNode[] = [
    ...stime.map((r) => <StimaDaApprovare key={`s${r.id}`} r={r} bloccato={bloccato} onFatto={onFatto} />),
    ...preventivi.map((p) => (
      <div key={`p${p.id}`} className="bg-ink-3 px-notch-sm p-3 sm:p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-pixel text-xl text-azione leading-none tabular-nums">{eur(p.totale)}</p>
          <Etichetta area={p.scaduto ? 'fumo' : 'azione'}>{p.scaduto ? 'Scaduto' : 'Preventivo'}</Etichetta>
        </div>
        <p className="text-sm sm:text-base text-chiaro mt-2">{p.oggetto}</p>
        {p.scaduto && <p className="text-xs text-nebbia mt-1">Aprilo per chiedere un&apos;accettazione tardiva.</p>}
        <div className="flex items-center gap-2 mt-3">
          {!p.scaduto && (
            <button disabled={bloccato || busy === p.id} onClick={() => rispondi(p.id, 'accetta')} className="px-btn flex-1 font-pixel text-[11px] px-3 py-2 bg-azione text-ink">Accetta</button>
          )}
          <a href={`/p/${p.token}`} target="_blank" rel="noreferrer" className={btn2}>{p.scaduto ? 'Apri' : 'Leggi'}</a>
          {!p.scaduto && <button disabled={bloccato || busy === p.id} onClick={() => rispondi(p.id, 'rifiuta')} className={btn2}>No</button>}
        </div>
      </div>
    )),
    ...attese.map((l) => (
      <div key={`a${l.id}`} className="bg-ink-3 px-notch-sm p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm sm:text-base text-chiaro">{l.titolo}</p>
          <Etichetta area="azione">Mi serve</Etichetta>
        </div>
        <p className="text-sm text-nebbia mt-1 whitespace-pre-wrap">{l.attesa_cliente}</p>
      </div>
    )),
    ...fatture.map((f) => (
      <div key={`f${f.id}`} className="bg-ink-3 px-notch-sm p-3 sm:p-4">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-pixel text-xl text-soldi leading-none tabular-nums">{eur(f.stato === 'parziale' && f.residuo != null ? f.residuo : f.importo ?? 0)}</p>
          {f.pdf_url && <a href={f.pdf_url} target="_blank" rel="noreferrer" className="font-pixel text-[11px] text-soldi hover:underline underline-offset-4">PDF</a>}
        </div>
        <p className="text-sm sm:text-base text-chiaro mt-2">Fattura {f.numero ? `n. ${f.numero}` : ''} da saldare</p>
        <p className="text-xs text-fumo mt-0.5">{f.stato === 'parziale' ? `parte di ${eur(f.importo ?? 0)} · ` : ''}del {dataIt(f.data)}</p>
      </div>
    )),
  ];
  return (
    <>
      <div className="grid gap-2 xl:grid-cols-2">{tutte ? voci : voci.slice(0, 4)}</div>
      {voci.length > 4 && <div className="mt-3"><VediTutti aperto={tutte} n={voci.length} onClick={() => setTutte((v) => !v)} /></div>}
    </>
  );
}

// ── Lavori ──

function Progetti({ progetti }: { progetti: Preventivo[] }) {
  const [tutti, setTutti] = useState(false);
  if (progetti.length === 0) {
    return (
      <div className="flex items-center gap-4 bg-ink-3 px-notch-sm p-4">
        <Omino scala={3} />
        <p className="text-sm text-nebbia">Nessun progetto attivo. Quando accetti un preventivo, qui ne segui l&apos;avanzamento.</p>
      </div>
    );
  }
  const visibili = tutti ? progetti : progetti.slice(0, 5);
  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {visibili.map((p) => {
          const st = statoProgetto(p);
          const passi = [true, !!p.lavoro_inizio, !!p.lavoro_fine];
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 bg-ink-3/60 px-notch-sm p-3">
              <div className="min-w-0">
                <p className="text-sm sm:text-base text-chiaro">{p.oggetto}</p>
                <p className="text-xs text-fumo mt-0.5">
                  {p.lavoro_fine ? `consegnato il ${dataIt(p.lavoro_fine)}` : p.lavoro_inizio ? `iniziato il ${dataIt(p.lavoro_inizio)}` : p.accettato_at ? `accettato il ${dataIt(p.accettato_at)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="flex gap-[3px]" title="accettato, in corso, consegnato">
                  {passi.map((ok, i) => (
                    <span key={i} className={`block w-5 h-3 ${ok ? (p.lavoro_fine ? 'bg-fatto' : 'bg-lavori') : 'bg-ink-4'}`} />
                  ))}
                </span>
                <Etichetta area={st.area}>{st.label}</Etichetta>
              </div>
            </li>
          );
        })}
      </ul>
      {progetti.length > 5 && <div className="mt-3"><VediTutti aperto={tutti} n={progetti.length} onClick={() => setTutti((v) => !v)} /></div>}
    </>
  );
}

// ── Ore ──

function FineMese({ mese, oggi, tariffa }: { mese: NonNullable<NonNullable<DatiArea['canone']>['corrente']>; oggi: string; tariffa: number }) {
  const d = new Date(`${oggi}T12:00:00`);
  const giorni = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate();
  const poche = mese.rimaste > 0 && mese.rimaste < 120;
  return (
    <div className="mt-4 bg-ink-3 px-notch-sm px-3 py-2.5 text-xs leading-relaxed">
      <p className="text-nebbia">
        Fine mese tra <span className="font-pixel text-chiaro">{giorni}</span> {giorni === 1 ? 'giorno' : 'giorni'}
        {mese.riporto_prossimo > 0 && <>: se non le usate, {fmtMinuti(mese.riporto_prossimo)} passano a {soloMese(meseSuccessivo(mese.mese))}</>}.
      </p>
      {mese.scadono > 0 && <p className="text-azione">{fmtMinuti(mese.scadono)} del mese scorso scadono a fine mese.</p>}
      {poche && <p className="text-soldi">Restano meno di 2 ore: oltre, {eur(tariffa)} l&apos;ora.</p>}
    </div>
  );
}

function RichiesteAperte({ richieste }: { richieste: NonNullable<DatiArea['canone']>['richieste'] }) {
  if (richieste.length === 0) return null;
  return (
    <div className="mt-5">
      <p className="font-pixel text-xs text-nebbia mb-2">Le tue richieste</p>
      <ul className="flex flex-col gap-2">
        {richieste.map((r) => (
          <li key={r.id} className="bg-ink-3 px-notch-sm px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-fumo truncate">{r.sito || 'Richiesta'} · {giorno(r.creata_il?.slice(0, 10) ?? null)}</span>
              <Etichetta area={STATO_RICHIESTA[r.stato].area}>{STATO_RICHIESTA[r.stato].label}</Etichetta>
            </div>
            <p className="text-sm mt-1.5 line-clamp-2">{r.testo}</p>
            {r.ore_stimate != null && <p className="text-xs text-fumo mt-1">Stima: {ore(r.ore_stimate)}{r.consegna_prevista ? ` · consegna ${giorno(r.consegna_prevista)}` : ''}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Pagamenti ──

function Riga({ label, valore, colore = 'text-chiaro' }: { label: string; valore: string; colore?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-nebbia">{label}</dt>
      <dd className={`font-pixel text-sm tabular-nums ${colore}`}>{valore}</dd>
    </div>
  );
}

function Fatture({ fatture }: { fatture: DatiArea['fatture'] }) {
  const [tutte, setTutte] = useState(false);
  if (fatture.length === 0) return <p className="text-sm text-nebbia">Nessuna fattura disponibile.</p>;
  const visibili = tutte ? fatture : fatture.slice(0, 5);
  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {visibili.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 bg-ink-3/60 px-notch-sm px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm text-chiaro">{f.numero ? `Fattura n. ${f.numero}` : 'Fattura'}</p>
              <p className="text-xs text-fumo mt-0.5">del {dataIt(f.data)}{f.stato === 'parziale' && f.residuo != null ? ` · restano ${eur(f.residuo)}` : ''}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Etichetta area={f.stato === 'pagata' ? 'fatto' : 'soldi'}>{f.stato === 'pagata' ? 'Pagata' : f.stato === 'parziale' ? 'In parte' : 'Da pagare'}</Etichetta>
              <span className="font-pixel text-sm text-soldi tabular-nums">{f.importo != null ? eur(f.importo) : ''}</span>
              {f.pdf_url && <a href={f.pdf_url} target="_blank" rel="noreferrer" className="font-pixel text-[11px] text-nebbia hover:text-chiaro">PDF</a>}
            </div>
          </li>
        ))}
      </ul>
      {fatture.length > 5 && <div className="mt-3"><VediTutti aperto={tutte} n={fatture.length} onClick={() => setTutte((v) => !v)} /></div>}
    </>
  );
}

function Preventivi({ preventivi }: { preventivi: Preventivo[] }) {
  const [tutti, setTutti] = useState(false);
  if (preventivi.length === 0) return <p className="text-sm text-nebbia">Nessun preventivo.</p>;
  const visibili = tutti ? preventivi : preventivi.slice(0, 5);
  return (
    <>
      <ul className="flex flex-col gap-1.5">
        {visibili.map((p) => {
          const st = p.scaduto ? { label: 'Scaduto', area: 'fumo' as Area } : STATO_PREVENTIVO[p.stato] ?? { label: p.stato, area: 'fumo' as Area };
          return (
            <li key={p.id}>
              <a href={`/p/${p.token}`} target="_blank" rel="noreferrer"
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-ink-3/60 hover:bg-ink-3 px-notch-sm px-3 py-2.5 transition-colors">
                <span className="text-sm text-chiaro min-w-0">{p.oggetto}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <Etichetta area={st.area}>{st.label}</Etichetta>
                  <span className="font-pixel text-sm text-nebbia tabular-nums">{eur(p.totale)}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {preventivi.length > 5 && <div className="mt-3"><VediTutti aperto={tutti} n={preventivi.length} onClick={() => setTutti((v) => !v)} /></div>}
    </>
  );
}

// ── Profilo: dati e regole del canone, fuori dalle tab ──

function Profilo({ dati, onChiudi }: { dati: DatiArea; onChiudi: () => void }) {
  const { cliente, canone } = dati;
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onChiudi();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onChiudi]);
  const campi = [
    ['Nome', cliente.nome],
    ['Azienda', cliente.azienda],
    ['Email', cliente.email],
    ['Telefono', cliente.telefono],
    ['P. IVA', cliente.piva],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm grid place-items-center p-4" onClick={onChiudi} role="dialog" aria-modal="true" aria-label="I tuoi dati">
      <div className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto px-scroll" onClick={(e) => e.stopPropagation()}>
        <Tile area="fumo">
          <Titolo area="fumo" icona="domanda" destra={<button onClick={onChiudi} className="font-pixel text-xs text-nebbia hover:text-chiaro">Chiudi</button>}>
            I tuoi dati
          </Titolo>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {campi.map(([k, v]) => (
              <div key={k} className="bg-ink-3 px-notch-sm px-3 py-2 min-w-0">
                <dt className="text-fumo text-[11px]">{k}</dt>
                <dd className="mt-0.5 text-sm truncate">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-fumo mt-3">Un dato non è corretto? Scrivimi e lo sistemo.</p>
          {canone && (
            <>
              <p className="font-pixel text-sm text-chiaro mt-6 mb-3">Come funziona il canone</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Regola area="ore" icona="clessidra" titolo={`${ore(canone.canone.ore_mese)} al mese`}>
                  Canone di {eur(canone.canone.prezzo_mese)} al mese, ore usabili su tutti i vostri siti.
                </Regola>
                <Regola area="ore" icona="calendario" titolo="Le ore avanzano">
                  Quelle non usate passano al mese dopo e valgono {canone.canone.riporto_mesi === 1 ? 'per quel mese' : `per ${canone.canone.riporto_mesi} mesi`}: si usano per prime.
                </Regola>
                <Regola area="soldi" icona="moneta" titolo="Ore extra">
                  Oltre le ore disponibili, le ore in più sono a {eur(canone.canone.tariffa_extra)} l&apos;ora.
                </Regola>
                <Regola area="lavori" icona="bandiera" titolo="Fuori canone">
                  I lavori con un preventivo o un prezzo a parte non consumano ore.
                </Regola>
              </ul>
            </>
          )}
        </Tile>
      </div>
    </div>
  );
}

