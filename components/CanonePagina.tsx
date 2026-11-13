'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { euroCent } from '@/lib/formato';
import { fmtMinuti, meseDi, meseSuccessivo, nomeMese, type MeseCanone } from '@/lib/canone-calcolo';
import type { Canone, Intervento, Lavoro, Richiesta, Scadenza } from '@/lib/canone';
import { pixelFont } from '@/lib/font-pixel';
import { Icona, Omino, type NomeIcona } from '@/components/pixel/Sprite';

interface Props {
  cliente: { nome: string; azienda: string | null };
  oggi: string;
  canone: Canone;
  mesi: MeseCanone[];
  corrente: MeseCanone | null;
  interventi: Intervento[];
  lavori: Lavoro[];
  richieste: Richiesta[];
  pagamenti: Scadenza[];
  /** Vista di Mauro dal gestionale: niente header cliente, azioni disattivate. */
  anteprima?: { indietro: string };
}

// ── Utilità ──

const giorno = (d: string | null, anno = false) =>
  d
    ? new Date(`${d}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', ...(anno && { year: 'numeric' }) })
    : '';

const giorniTra = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);

const aggiungiGiorni = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00`);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

const ore = (n: number | null) => (n == null ? '' : `${String(n).replace('.', ',')} h`);
const soloMese = (mese: string) => nomeMese(mese).split(' ')[0];

// Ogni area della pagina ha un colore: aiuta a orientarsi e a ritrovare le cose.
type Area = 'ore' | 'lavori' | 'soldi' | 'azione' | 'fatto' | 'fumo';
const AREA: Record<Area, { testo: string; sfondo: string; tenue: string; var: string }> = {
  ore: { testo: 'text-ore', sfondo: 'bg-ore', tenue: 'bg-ore/15', var: 'var(--color-ore)' },
  lavori: { testo: 'text-lavori', sfondo: 'bg-lavori', tenue: 'bg-lavori/15', var: 'var(--color-lavori)' },
  soldi: { testo: 'text-soldi', sfondo: 'bg-soldi', tenue: 'bg-soldi/15', var: 'var(--color-soldi)' },
  azione: { testo: 'text-azione', sfondo: 'bg-azione', tenue: 'bg-azione/15', var: 'var(--color-azione)' },
  fatto: { testo: 'text-fatto', sfondo: 'bg-fatto', tenue: 'bg-fatto/15', var: 'var(--color-fatto)' },
  fumo: { testo: 'text-nebbia', sfondo: 'bg-fumo', tenue: 'bg-fumo/15', var: 'var(--color-ink-4)' },
};

const STATO_LAVORO: Record<string, { label: string; area: Area }> = {
  da_avviare: { label: 'Da avviare', area: 'fumo' },
  in_corso: { label: 'In corso', area: 'lavori' },
  attesa_cliente: { label: 'Aspetto voi', area: 'azione' },
  completato: { label: 'Consegnato', area: 'fatto' },
};

const STATO_RICHIESTA: Record<string, { label: string; area: Area }> = {
  nuova: { label: 'In valutazione', area: 'fumo' },
  stimata: { label: 'Da approvare', area: 'azione' },
  approvata: { label: 'In lavorazione', area: 'lavori' },
  rifiutata: { label: 'Non approvata', area: 'fumo' },
  completata: { label: 'Fatta', area: 'fatto' },
};

// ── Mattoncini del bento ──

function Tile({ area, id, className = '', children }: { area: Area; id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className={`px-notch bg-ink-2 p-4 sm:p-5 min-w-0 scroll-mt-4 ${className}`}
      style={{ boxShadow: `inset 0 4px 0 ${AREA[area].var}` }}
    >
      {children}
    </section>
  );
}

function Titolo({ area, icona, children, destra }: { area: Area; icona: NomeIcona; children: React.ReactNode; destra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h2 className="flex items-center gap-2.5 font-pixel text-[15px] leading-none text-chiaro">
        <span className={`grid place-items-center w-7 h-7 px-notch-sm ${AREA[area].tenue} ${AREA[area].testo}`}>
          <Icona nome={icona} />
        </span>
        {children}
      </h2>
      {destra}
    </div>
  );
}

function Etichetta({ area, children }: { area: Area; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-notch-sm font-pixel text-[10px] leading-none px-2 py-1 ${AREA[area].tenue} ${AREA[area].testo}`}>
      {children}
    </span>
  );
}

// ── Pagina ──

export default function CanonePagina(p: Props) {
  const router = useRouter();
  const { canone, corrente, oggi } = p;

  const esci = async () => {
    await fetch('/api/portale/esci', { method: 'POST' });
    window.location.href = '/accedi';
  };

  const daApprovare = p.richieste.filter((r) => r.stato === 'stimata');
  const aperte = p.richieste.filter((r) => r.stato === 'nuova' || r.stato === 'approvata');
  const attese = p.lavori.filter((l) => l.stato === 'attesa_cliente' && l.attesa_cliente);
  const inCorso = p.lavori.filter((l) => l.stato === 'in_corso');
  const daFare = daApprovare.length + attese.length;
  const attivi = p.lavori.filter((l) => l.stato !== 'completato');
  const prossima = attivi
    .filter((l) => l.consegna_prevista && l.consegna_prevista >= oggi)
    .sort((a, b) => a.consegna_prevista!.localeCompare(b.consegna_prevista!))[0];

  const dataLunga = new Date(`${oggi}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={`${pixelFont.variable} min-h-screen px-tela text-chiaro`}>
      {p.anteprima ? (
        <div className="bg-ink-2 border-b-2 border-azione/50">
          <div className="max-w-[1760px] mx-auto px-4 sm:px-6 xl:px-10 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 text-chiaro">
              <Icona nome="esclamativo" className="text-azione" />
              Anteprima: è la pagina che vede {p.cliente.nome}. I pulsanti sono disattivati.
            </span>
            <a href={p.anteprima.indietro} className="text-nebbia hover:text-chiaro underline-offset-4 hover:underline">
              Torna alla scheda cliente
            </a>
          </div>
        </div>
      ) : (
        <header className="border-b-2 border-ink-3 bg-ink/80 backdrop-blur">
          <div className="max-w-[1760px] mx-auto px-4 sm:px-6 xl:px-10 h-14 flex items-center justify-between gap-3">
            <img src="/Logo.svg" alt="MAURO DEV" className="h-6 w-auto brightness-0 invert" />
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <span className="text-sm text-nebbia truncate hidden sm:block">{p.cliente.azienda || p.cliente.nome}</span>
              <a href="/portale" className="text-xs text-fumo hover:text-chiaro transition-colors shrink-0">
                Preventivi e fatture
              </a>
              <button onClick={esci} className="text-xs text-fumo hover:text-chiaro transition-colors shrink-0">
                Esci
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-[1760px] mx-auto px-4 sm:px-6 xl:px-10 py-5 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-3 sm:gap-4">
          {/* Benvenuto */}
          <section className="md:col-span-4 xl:col-span-5 px-notch bg-ink-2 p-4 sm:p-6 flex flex-col justify-between gap-5 min-w-0">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative shrink-0">
                {daFare > 0 && (
                  <span className="absolute -top-4 -right-2 px-hop text-azione">
                    <Icona nome="esclamativo" scala={3} />
                  </span>
                )}
                <div className="sm:hidden"><Omino scala={5} alLavoro={inCorso.length > 0} /></div>
                <div className="hidden sm:block"><Omino scala={8} alLavoro={inCorso.length > 0} /></div>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-fumo capitalize mb-1.5">{dataLunga}</p>
                <h1 className="font-pixel text-2xl sm:text-4xl leading-tight mb-3 break-words">Ciao {p.cliente.nome.split(' ')[0]}</h1>
                <p className="inline-block bg-ink-3 px-notch-sm px-3 py-2 text-sm text-nebbia leading-snug">
                  {daFare > 0 ? (
                    <>
                      Mi serve {daFare === 1 ? 'una tua risposta' : 'qualche tua risposta'}: trovi tutto nel riquadro{' '}
                      <span className="text-azione font-medium">rosa</span>.
                    </>
                  ) : inCorso.length > 0 ? (
                    <>
                      Sto lavorando a <span className="text-lavori font-medium">{inCorso[0].titolo}</span>
                      {inCorso.length > 1 ? ` e ad altri ${inCorso.length - 1}` : ''}
                      <span className="px-dots" />
                    </>
                  ) : (
                    <>Tutto in ordine. Se ti serve qualcosa, scrivimi da qui o come sempre.</>
                  )}
                </p>
              </div>
            </div>
            {/* Colpo d'occhio: un numero per area */}
            <div className="grid grid-cols-3 gap-2">
              <Lampo area="ore" valore={corrente ? fmtMinuti(corrente.rimaste) : '-'} label="ore rimaste" />
              <Lampo area="lavori" valore={String(attivi.length)} label={attivi.length === 1 ? 'lavoro aperto' : 'lavori aperti'} />
              <Lampo area="lavori" valore={prossima ? giorno(prossima.consegna_prevista) : '-'} label="prossima consegna" />
            </div>
          </section>

          {/* Serve qualcosa da voi / tutto a posto */}
          {daFare > 0 ? (
            <Tile area="azione" className="md:col-span-2 xl:col-span-3">
              <Titolo area="azione" icona="esclamativo" destra={<span className="font-pixel text-azione text-lg leading-none">{daFare}</span>}>
                Serve da voi
              </Titolo>
              <div className="flex flex-col gap-2">
                {daApprovare.map((r) => (
                  <StimaDaApprovare key={r.id} r={r} bloccato={!!p.anteprima} onFatto={() => router.refresh()} />
                ))}
                {attese.map((l) => (
                  <div key={l.id} className="bg-ink-3 px-notch-sm px-3 py-2.5">
                    <p className="text-sm font-medium">{l.titolo}{l.sito ? <span className="text-fumo font-normal"> · {l.sito}</span> : null}</p>
                    <p className="text-sm text-nebbia mt-0.5 whitespace-pre-wrap">{l.attesa_cliente}</p>
                  </div>
                ))}
              </div>
            </Tile>
          ) : (
            <Tile area="fatto" className="md:col-span-2 xl:col-span-3 flex flex-col justify-center">
              <Titolo area="fatto" icona="spunta">Tutto a posto</Titolo>
              <p className="text-sm text-nebbia">Non aspetto niente da voi. Se serve una vostra risposta o un&apos;approvazione, compare qui.</p>
            </Tile>
          )}

          {/* Monte ore */}
          {corrente ? (
            <>
              <MonteOre mese={corrente} />
              <div className="md:col-span-2 xl:col-span-3 grid grid-cols-2 md:grid-cols-1 gap-3 sm:gap-4 min-w-0">
                <FineMese canone={canone} mese={corrente} oggi={oggi} />
                <ProssimoPagamento pagamenti={p.pagamenti} />
              </div>
            </>
          ) : (
            <Tile area="ore" className="md:col-span-6 xl:col-span-12">
              <Titolo area="ore" icona="clessidra">Monte ore</Titolo>
              <p className="text-sm text-nebbia">Il canone parte da {nomeMese(meseDi(canone.inizio))}: da quel mese trovi qui le ore.</p>
            </Tile>
          )}

          {/* Lavori */}
          <Tile area="lavori" className="md:col-span-6 xl:col-span-9">
            <Titolo area="lavori" icona="bandiera"
              destra={<span className="text-xs text-fumo">Le consegne sono stime: se cambiano, le aggiorno qui.</span>}>
              Lavori e consegne
            </Titolo>
            <Timeline lavori={p.lavori} oggi={oggi} />
          </Tile>

          {/* Interventi */}
          <Tile area="ore" className="md:col-span-4 xl:col-span-5">
            <RegistroInterventi interventi={p.interventi} siti={canone.siti} meseCorrente={meseDi(oggi)} />
          </Tile>

          {/* Nuova richiesta */}
          <Tile area="azione" className="md:col-span-2 xl:col-span-3">
            <Titolo area="azione" icona="fumetto">Chiedimi qualcosa</Titolo>
            <p className="text-xs text-fumo mb-3 leading-relaxed">
              Facoltativo: mail e messaggi vanno benissimo. Da qui ti rispondo con una stima in ore prima di partire.
            </p>
            <NuovaRichiesta siti={canone.siti} bloccato={!!p.anteprima} onFatto={() => router.refresh()} />
            {aperte.length > 0 && (
              <ul className="flex flex-col gap-2 mt-4">
                {aperte.map((r) => (
                  <li key={r.id} className="bg-ink-3 px-notch-sm px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-fumo truncate">{r.sito || 'Richiesta'} · {giorno(r.creata_il?.slice(0, 10) ?? null)}</span>
                      <Etichetta area={STATO_RICHIESTA[r.stato].area}>{STATO_RICHIESTA[r.stato].label}</Etichetta>
                    </div>
                    <p className="text-sm mt-1.5 line-clamp-3 whitespace-pre-wrap">{r.testo}</p>
                    {r.ore_stimate != null && (
                      <p className="text-xs text-fumo mt-1">Stima: {ore(r.ore_stimate)}{r.consegna_prevista ? ` · consegna ${giorno(r.consegna_prevista)}` : ''}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Tile>

          {/* Pagamenti */}
          <Tile area="soldi" id="pagamenti" className="md:col-span-2 xl:col-span-4">
            <Titolo area="soldi" icona="moneta">Pagamenti</Titolo>
            <Pagamenti pagamenti={p.pagamenti} />
          </Tile>

          {/* Storico */}
          <Tile area="fumo" className="md:col-span-4 xl:col-span-5">
            <Titolo area="fumo" icona="calendario">Mese per mese</Titolo>
            {p.mesi.length > 0 ? <Storico mesi={p.mesi} /> : <p className="text-sm text-nebbia">Lo storico parte dal primo mese di canone.</p>}
          </Tile>

          {/* Come funziona */}
          <Tile area="fumo" className="md:col-span-6 xl:col-span-7">
            <Titolo area="fumo" icona="domanda">Come funziona</Titolo>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-3">
              <Regola area="ore" icona="clessidra" titolo={`${ore(canone.ore_mese)} al mese`}>
                Canone di {euroCent(canone.prezzo_mese)} al mese, ore usabili su tutti i vostri siti.
              </Regola>
              <Regola area="ore" icona="calendario" titolo="Le ore avanzano">
                Quelle non usate passano al mese dopo e valgono {canone.riporto_mesi === 1 ? 'per quel mese' : `per ${canone.riporto_mesi} mesi`}: si usano per prime.
              </Regola>
              <Regola area="soldi" icona="moneta" titolo="Ore extra">
                Oltre le ore disponibili, le ore in più sono a {euroCent(canone.tariffa_extra)} l&apos;ora.
              </Regola>
              <Regola area="lavori" icona="bandiera" titolo="Fuori canone">
                I lavori con un preventivo o un prezzo a parte non consumano ore.
              </Regola>
            </ul>
          </Tile>
        </div>
      </main>
    </div>
  );
}

function Lampo({ area, valore, label }: { area: Area; valore: string; label: string }) {
  return (
    <div className="bg-ink-3 px-notch-sm px-3 py-2.5 min-w-0">
      <p className={`font-pixel text-base sm:text-xl leading-none truncate ${AREA[area].testo}`}>{valore}</p>
      <p className="text-[11px] text-fumo mt-1 truncate">{label}</p>
    </div>
  );
}

function Regola({ area, icona, titolo, children }: { area: Area; icona: NomeIcona; titolo: string; children: React.ReactNode }) {
  return (
    <li className="bg-ink-3 px-notch-sm p-3.5">
      <p className={`flex items-center gap-2 font-pixel text-sm mb-1.5 ${AREA[area].testo}`}>
        <Icona nome={icona} /> {titolo}
      </p>
      <p className="text-sm text-nebbia leading-relaxed">{children}</p>
    </li>
  );
}

// ── Monte ore del mese: ogni ora è un quadrotto di 4 pixel da 15 minuti ──

type Cella = 'usata' | 'riporto' | 'libera' | 'extra';
const quarti = (m: number) => Math.round(m / 15);

function MonteOre({ mese }: { mese: MeseCanone }) {
  const disponibili = mese.incluse + mese.riportate;

  const celle = useMemo(() => {
    const out: Cella[] = [];
    for (let i = 0; i < quarti(mese.riportate); i++) out.push(i < quarti(mese.da_riporto) ? 'usata' : 'riporto');
    for (let i = 0; i < quarti(mese.incluse); i++) out.push(i < quarti(mese.da_incluse) ? 'usata' : 'libera');
    const extra = quarti(mese.extra);
    if (extra > 0) {
      while (out.length % 4) out.push('libera'); // l'extra parte da un'ora nuova
      for (let i = 0; i < extra; i++) out.push('extra');
    }
    return out;
  }, [mese]);

  const quadrotti: Cella[][] = [];
  for (let i = 0; i < celle.length; i += 4) quadrotti.push(celle.slice(i, i + 4));

  const colore: Record<Cella, string> = {
    usata: 'bg-ore',
    riporto: 'bg-ore/25',
    libera: 'bg-ink-4',
    extra: 'bg-soldi',
  };

  const h = Math.floor(mese.rimaste / 60);
  const m = mese.rimaste % 60;

  return (
    <Tile area="ore" className="md:col-span-4 xl:col-span-4">
      <Titolo area="ore" icona="clessidra">Ore di {soloMese(mese.mese)}</Titolo>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-1 mb-5">
        <p className="font-pixel text-ore leading-none tabular-nums">
          <span className="text-5xl sm:text-6xl">{h}</span>
          <span className="text-2xl sm:text-3xl">h</span>
          {m > 0 && (
            <>
              <span className="text-4xl sm:text-5xl ml-2">{m}</span>
              <span className="text-xl sm:text-2xl">m</span>
            </>
          )}
        </p>
        <p className="text-nebbia text-sm pb-1">
          rimaste su <span className="text-chiaro font-medium">{fmtMinuti(disponibili)}</span>
          {mese.extra > 0 && <span className="block text-soldi">+ {fmtMinuti(mese.extra)} extra ({euroCent(mese.costo_extra)})</span>}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2" role="img"
        aria-label={`Usate ${fmtMinuti(mese.usate)} su ${fmtMinuti(disponibili)}; ogni quadrato è un'ora, ogni pixel 15 minuti`}>
        {quadrotti.map((q, i) => (
          <div key={i} className="grid grid-cols-2 gap-[2px] px-pop" style={{ animationDelay: `${Math.min(i * 25, 600)}ms` }}>
            {q.map((c, k) => (
              <span key={k} className={`block w-2.5 h-2.5 sm:w-3 sm:h-3 ${colore[c]}`} />
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-fumo">
        <Leggenda c="bg-ore">usate</Leggenda>
        {mese.riportate > 0 && <Leggenda c="bg-ore/25">dal mese prima</Leggenda>}
        <Leggenda c="bg-ink-4">del canone</Leggenda>
        {mese.extra > 0 && <Leggenda c="bg-soldi">extra</Leggenda>}
        <span>1 quadrato = 1 ora, 1 pixel = 15 minuti</span>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2 mt-5">
        <Dato label="Del canone" valore={fmtMinuti(mese.incluse)} />
        <Dato label="Dal mese prima" valore={fmtMinuti(mese.riportate)} />
        <Dato label="Usate" valore={fmtMinuti(mese.usate)} />
        <Dato label="Fuori canone" valore={fmtMinuti(mese.fuori_canone)} />
      </dl>
    </Tile>
  );
}

function Leggenda({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block w-2.5 h-2.5 ${c}`} />
      {children}
    </span>
  );
}

function Dato({ label, valore }: { label: string; valore: string }) {
  return (
    <div className="bg-ink-3 px-notch-sm px-3 py-2">
      <dt className="text-fumo text-[11px]">{label}</dt>
      <dd className="mt-0.5 text-sm tabular-nums text-chiaro">{valore}</dd>
    </div>
  );
}

function FineMese({ canone, mese, oggi }: { canone: Canone; mese: MeseCanone; oggi: string }) {
  const d = new Date(`${oggi}T12:00:00`);
  const giorni = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() - d.getDate();
  const poche = mese.rimaste > 0 && mese.rimaste < 120;
  return (
    <section className="px-notch bg-ink-2 p-4 min-w-0" style={{ boxShadow: `inset 0 4px 0 ${AREA.ore.var}` }}>
      <p className="text-xs text-fumo mb-2">Alla fine di {soloMese(mese.mese)}</p>
      <p className="font-pixel leading-none mb-2">
        <span className="text-4xl sm:text-5xl">{giorni}</span>{' '}
        <span className="text-base text-nebbia">{giorni === 1 ? 'giorno' : 'giorni'}</span>
      </p>
      <div className="flex flex-col gap-1 text-xs leading-snug">
        {mese.riporto_prossimo > 0 && (
          <p className="text-nebbia">Se non le usate, {fmtMinuti(mese.riporto_prossimo)} passano a {soloMese(meseSuccessivo(mese.mese))}.</p>
        )}
        {mese.scadono > 0 && <p className="text-azione">{fmtMinuti(mese.scadono)} del mese scorso scadono a fine mese.</p>}
        {poche && <p className="text-soldi">Restano meno di 2 ore: oltre, {euroCent(canone.tariffa_extra)} l&apos;ora.</p>}
      </div>
    </section>
  );
}

function ProssimoPagamento({ pagamenti }: { pagamenti: Scadenza[] }) {
  const primo = pagamenti[0];
  return (
    <a href="#pagamenti" className="block px-notch bg-ink-2 p-4 min-w-0 hover:bg-ink-3 transition-colors"
      style={{ boxShadow: `inset 0 4px 0 ${AREA.soldi.var}` }}>
      <p className="text-xs text-fumo mb-2 flex items-center gap-1.5">
        <Icona nome="moneta" className="text-soldi" /> {primo ? 'Prossimo pagamento' : 'Pagamenti'}
      </p>
      {primo ? (
        <>
          <p className="font-pixel text-2xl sm:text-3xl text-soldi leading-none mb-1.5 tabular-nums">{euroCent(primo.importo)}</p>
          <p className="text-xs text-nebbia line-clamp-2">{primo.descrizione}</p>
          {pagamenti.length > 1 && <p className="text-xs text-fumo mt-1">e altri {pagamenti.length - 1}</p>}
        </>
      ) : (
        <p className="font-pixel text-xl text-fatto leading-none">Niente in sospeso</p>
      )}
    </a>
  );
}

// ── Timeline ──

function Timeline({ lavori, oggi }: { lavori: Lavoro[]; oggi: string }) {
  const [mostraFatti, setMostraFatti] = useState(false);
  const fatti = lavori.filter((l) => l.stato === 'completato');
  const visibili = lavori.filter((l) => mostraFatti || l.stato !== 'completato');

  const { da, a } = useMemo(() => {
    const date = visibili.flatMap((l) => [l.inizio, l.consegna_prevista, l.completato_il]).filter(Boolean) as string[];
    let da = aggiungiGiorni(oggi, -14);
    let a = aggiungiGiorni(oggi, 30);
    for (const d of date) {
      if (d < da) da = d;
      if (d > a) a = d;
    }
    return { da, a: aggiungiGiorni(a, 5) };
  }, [visibili, oggi]);

  if (lavori.length === 0) {
    return (
      <div className="flex items-center gap-4 bg-ink-3 px-notch-sm p-4">
        <Omino scala={3} />
        <p className="text-sm text-nebbia">Nessun lavoro in corso al momento. Quando ne parte uno, qui vedi l&apos;avanzamento e la consegna stimata.</p>
      </div>
    );
  }

  const span = Math.max(1, giorniTra(da, a));
  const x = (d: string) => Math.min(100, Math.max(0, (giorniTra(da, d) / span) * 100));

  const tacche: { pos: number; label: string }[] = [];
  for (let m = `${meseDi(da)}-01`; m <= a; ) {
    if (m >= da) tacche.push({ pos: x(m), label: new Date(`${m}T12:00:00`).toLocaleDateString('it-IT', { month: 'short' }) });
    const d = new Date(`${m}T12:00:00`);
    d.setMonth(d.getMonth() + 1);
    m = d.toISOString().slice(0, 10).replace(/-\d{2}$/, '-01');
  }
  const xo = x(oggi);

  return (
    <div>
      {/* Asse dei mesi con il segno di oggi */}
      <div className="md:grid md:grid-cols-[32%_1fr] gap-4">
        <div className="hidden md:block" />
        <div className="relative h-7 font-pixel text-[11px] text-fumo uppercase">
          {tacche.map((t) => (
            <span key={t.label + t.pos} className="absolute top-0 border-l-2 border-ink-4 pl-1 leading-none" style={{ left: `${t.pos}%` }}>
              {t.label}
            </span>
          ))}
          <span className="absolute bottom-0 -translate-x-1/2 text-chiaro" style={{ left: `${xo}%` }}>
            <Icona nome="freccia" />
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-3 md:gap-2.5">
        {visibili.map((l) => {
          const st = STATO_LAVORO[l.stato] ?? STATO_LAVORO.da_avviare;
          const col = AREA[st.area];
          const inizio = l.inizio ?? (l.consegna_prevista && l.consegna_prevista < oggi ? l.consegna_prevista : oggi);
          const fine = l.completato_il ?? l.consegna_prevista;
          const mancano = l.consegna_prevista && l.stato !== 'completato' ? giorniTra(oggi, l.consegna_prevista) : null;
          const avanz = l.ore_stimate ? Math.min(100, (l.minuti_usati / (l.ore_stimate * 60)) * 100) : l.stato === 'completato' ? 100 : 0;
          const quando =
            l.stato === 'completato' && l.completato_il
              ? `consegnato il ${giorno(l.completato_il)}`
              : l.consegna_prevista
                ? mancano == null
                  ? giorno(l.consegna_prevista)
                  : mancano > 0
                    ? `consegna ${giorno(l.consegna_prevista)}, tra ${mancano} ${mancano === 1 ? 'giorno' : 'giorni'}`
                    : mancano === 0
                      ? 'consegna oggi'
                      : `consegna prevista il ${giorno(l.consegna_prevista)}, in ritardo`
                : 'data da definire';
          return (
            <li key={l.id} className="md:grid md:grid-cols-[32%_1fr] md:items-center gap-4">
              <div className="min-w-0 mb-2 md:mb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-chiaro truncate">{l.titolo}</p>
                  <Etichetta area={st.area}>{st.label}</Etichetta>
                </div>
                <p className="text-xs text-fumo mt-1">
                  {[l.sito, quando, l.ore_stimate != null && `${fmtMinuti(l.minuti_usati)} su ~${ore(l.ore_stimate)}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="relative h-7 bg-ink-3 px-notch-sm">
                {tacche.map((t) => (
                  <span key={t.pos} className="absolute top-0 bottom-0 w-px bg-ink-4/70" style={{ left: `${t.pos}%` }} />
                ))}
                <span className="absolute top-0 bottom-0 w-0.5 bg-chiaro/80 z-10" style={{ left: `${xo}%` }} />
                {fine ? (
                  <div
                    className="absolute top-2 bottom-2 overflow-hidden"
                    style={{ left: `${x(inizio)}%`, width: `max(8px, ${x(fine) - x(inizio)}%)` }}
                    title={`${giorno(inizio, true)} → ${giorno(fine, true)}`}
                  >
                    <div className={`absolute inset-0 ${col.sfondo} opacity-35`} />
                    <div className={`absolute inset-y-0 left-0 ${col.sfondo}`} style={{ width: `${avanz}%` }} />
                  </div>
                ) : (
                  <div className={`absolute top-2 bottom-2 w-2 ${col.sfondo}`} style={{ left: `${x(inizio)}%` }} />
                )}
                {fine && (
                  <span className={`absolute top-1/2 -translate-y-1/2 z-20 ${col.testo}`}
                    style={{ left: `min(calc(${x(fine)}% + 2px), calc(100% - 16px))` }}>
                    <Icona nome={l.stato === 'completato' ? 'spunta' : 'bandiera'} />
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fumo">
          <span className="flex items-center gap-1.5"><Icona nome="freccia" className="text-chiaro" /> oggi</span>
          <span className="flex items-center gap-1.5"><Icona nome="bandiera" className="text-lavori" /> consegna stimata</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-2 bg-lavori" /> ore usate
            <span className="inline-block w-4 h-2 bg-lavori/35 ml-1" /> ore stimate
          </span>
        </div>
        {fatti.length > 0 && (
          <button onClick={() => setMostraFatti((v) => !v)} className="text-xs text-nebbia hover:text-chiaro transition-colors">
            {mostraFatti ? 'Nascondi i consegnati' : `Mostra i consegnati (${fatti.length})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Registro interventi ──

function RegistroInterventi({ interventi, siti, meseCorrente }: { interventi: Intervento[]; siti: string[]; meseCorrente: string }) {
  const mesi = useMemo(() => Array.from(new Set([meseCorrente, ...interventi.map((i) => meseDi(i.data))])).sort().reverse(), [interventi, meseCorrente]);
  const tuttiSiti = useMemo(
    () => Array.from(new Set([...siti, ...(interventi.map((i) => i.sito).filter(Boolean) as string[])])),
    [siti, interventi]
  );
  const [mese, setMese] = useState(meseCorrente);
  const [sito, setSito] = useState('');

  const righe = interventi.filter((i) => meseDi(i.data) === mese && (!sito || i.sito === sito));
  const totale = righe.filter((i) => !i.fuori_canone).reduce((s, i) => s + i.minuti, 0);

  const sel = 'bg-ink-3 px-notch-sm px-2.5 py-1.5 text-xs text-chiaro border-0';
  return (
    <>
      <Titolo area="ore" icona="registro"
        destra={
          <div className="flex items-center gap-2">
            <select value={mese} onChange={(e) => setMese(e.target.value)} className={sel} aria-label="Mese">
              {mesi.map((m) => (
                <option key={m} value={m}>{nomeMese(m)}</option>
              ))}
            </select>
            {tuttiSiti.length > 1 && (
              <select value={sito} onChange={(e) => setSito(e.target.value)} className={sel} aria-label="Sito">
                <option value="">Tutti i siti</option>
                {tuttiSiti.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        }>
        Interventi
      </Titolo>
      {righe.length === 0 ? (
        <p className="text-sm text-nebbia">Nessun intervento in questo periodo.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {righe.map((i) => {
              const [g, ms] = giorno(i.data).split(' ');
              return (
                <li key={i.id} className="flex items-stretch gap-3 bg-ink-3/60 px-notch-sm p-2.5">
                  <div className="w-11 shrink-0 flex flex-col items-center justify-center bg-ink-3 px-notch-sm py-1 font-pixel leading-none">
                    <span className="text-lg text-chiaro">{g}</span>
                    <span className="text-[10px] text-fumo uppercase">{ms}</span>
                  </div>
                  <div className="min-w-0 flex-1 self-center">
                    <p className="text-sm text-chiaro whitespace-pre-wrap">{i.descrizione}</p>
                    {(i.sito || i.richiesto_da) && (
                      <p className="text-xs text-fumo mt-0.5">{[i.sito, i.richiesto_da && `chiesto da ${i.richiesto_da}`].filter(Boolean).join(' · ')}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 self-center">
                    <p className={`font-pixel text-sm tabular-nums ${i.fuori_canone ? 'text-lavori' : 'text-ore'}`}>{fmtMinuti(i.minuti)}</p>
                    {i.fuori_canone && <p className="text-[11px] text-fumo">fuori canone</p>}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-fumo mt-3 text-right">
            Totale a canone{sito ? ` su ${sito}` : ''}: <span className="font-pixel text-sm text-ore tabular-nums">{fmtMinuti(totale)}</span>
          </p>
        </>
      )}
    </>
  );
}

// ── Pagamenti ──

function Pagamenti({ pagamenti }: { pagamenti: Scadenza[] }) {
  if (pagamenti.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-nebbia">
        <Icona nome="spunta" className="text-fatto" /> Niente in sospeso.
      </p>
    );
  }
  const etichetta = { fattura: 'Da pagare', tranche: 'Da fatturare', canone: 'Questo mese' } as const;
  return (
    <ul className="flex flex-col gap-2">
      {pagamenti.map((s, k) => (
        <li key={k} className="bg-ink-3 px-notch-sm px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm min-w-0 text-chiaro">{s.descrizione}</p>
            <p className="font-pixel text-base tabular-nums shrink-0 text-soldi leading-tight">{euroCent(s.importo)}</p>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <p className="text-xs text-fumo">{etichetta[s.tipo]}{s.data ? ` · del ${giorno(s.data, true)}` : ''}</p>
            {s.pdf_url && (
              <a href={s.pdf_url} target="_blank" rel="noreferrer" className="font-pixel text-xs text-soldi hover:underline underline-offset-4">PDF</a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Storico: colonne di tacche, 1 tacca = 1 ora ──

function Storico({ mesi }: { mesi: MeseCanone[] }) {
  const ultimi = mesi.slice(-12);
  const maxOre = Math.max(1, ...ultimi.map((m) => Math.ceil(Math.max(m.incluse + m.riportate, m.usate) / 60)));
  const unita = maxOre > 16 ? 2 : 1; // ore per tacca
  const breve = (min: number) => fmtMinuti(min).replace(' h ', 'h').replace(' min', 'm').replace(' h', 'h');
  return (
    <>
      <div className="flex items-end gap-2 sm:gap-3 overflow-x-auto pb-1">
        {ultimi.map((m) => {
          const usate = Math.round((m.da_riporto + m.da_incluse) / 60 / unita);
          const extra = Math.round(m.extra / 60 / unita);
          const tot = Math.ceil((m.incluse + m.riportate) / 60 / unita);
          const libere = Math.max(0, tot - usate);
          // Dal basso: usate, extra, libere.
          const tacche = [...Array(usate).fill('bg-ore'), ...Array(extra).fill('bg-soldi'), ...Array(libere).fill('bg-ink-4')];
          return (
            <div key={m.mese} className="flex flex-col items-center gap-1.5 flex-1 min-w-9 max-w-20"
              title={`${nomeMese(m.mese)}: usate ${fmtMinuti(m.usate)}${m.extra ? `, extra ${fmtMinuti(m.extra)}` : ''}, al mese dopo ${fmtMinuti(m.riporto_prossimo)}`}>
              <span className="font-pixel text-[11px] text-ore tabular-nums">{breve(m.usate)}</span>
              <div className="flex flex-col-reverse gap-[2px] w-full">
                {tacche.map((c, i) => (
                  <span key={i} className={`block w-full h-2 ${c}`} />
                ))}
              </div>
              <span className="font-pixel text-[11px] text-fumo uppercase">{soloMese(m.mese).slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-fumo mt-2">1 tacca = {unita === 1 ? '1 ora' : '2 ore'}.</p>
      <details className="mt-3">
        <summary className="text-xs text-nebbia cursor-pointer hover:text-chiaro select-none">Vedi i numeri</summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-xs text-fumo text-left">
                <th className="font-normal px-1 py-1.5">Mese</th>
                <th className="font-normal px-1 py-1.5 text-right">Riportate</th>
                <th className="font-normal px-1 py-1.5 text-right">Usate</th>
                <th className="font-normal px-1 py-1.5 text-right">Extra</th>
                <th className="font-normal px-1 py-1.5 text-right">Scadute</th>
                <th className="font-normal px-1 py-1.5 text-right">Al mese dopo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-4">
              {[...mesi].reverse().map((m) => (
                <tr key={m.mese} className="tabular-nums text-nebbia">
                  <td className="px-1 py-2 capitalize text-chiaro">{nomeMese(m.mese)}</td>
                  <td className="px-1 py-2 text-right">{m.riportate ? fmtMinuti(m.riportate) : '-'}</td>
                  <td className="px-1 py-2 text-right">{fmtMinuti(m.usate)}</td>
                  <td className="px-1 py-2 text-right">{m.extra ? `${fmtMinuti(m.extra)} (${euroCent(m.costo_extra)})` : '-'}</td>
                  <td className="px-1 py-2 text-right">{m.scadono ? fmtMinuti(m.scadono) : '-'}</td>
                  <td className="px-1 py-2 text-right">{fmtMinuti(m.riporto_prossimo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

// ── Richieste ──

function NuovaRichiesta({ siti, bloccato, onFatto }: { siti: string[]; bloccato?: boolean; onFatto: () => void }) {
  const [testo, setTesto] = useState('');
  const [sito, setSito] = useState('');
  const [urgente, setUrgente] = useState(false);
  const [stato, setStato] = useState<'idle' | 'invio' | 'ok' | string>('idle');

  const invia = async (e: React.FormEvent) => {
    e.preventDefault();
    setStato('invio');
    const res = await fetch('/api/portale/richieste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testo, sito: sito || null, urgente }),
    });
    if (res.ok) {
      setTesto('');
      setSito('');
      setUrgente(false);
      setStato('ok');
      onFatto();
    } else {
      setStato((await res.json().catch(() => ({}))).error || 'Invio non riuscito, riprova.');
    }
  };

  const campo = 'w-full bg-ink-3 px-notch-sm px-3 py-2 text-sm text-chiaro placeholder:text-fumo border-0 outline-none focus:bg-ink-4';
  return (
    <form onSubmit={invia} className="flex flex-col gap-2">
      {siti.length > 0 && (
        <select value={sito} onChange={(e) => setSito(e.target.value)} className={campo} aria-label="Sito">
          <option value="">Su quale sito?</option>
          {siti.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          <option value="Altro">Altro</option>
        </select>
      )}
      <textarea
        value={testo}
        onChange={(e) => {
          setTesto(e.target.value);
          if (stato === 'ok') setStato('idle');
        }}
        rows={4}
        required
        minLength={3}
        placeholder="Cosa serve? Link, pagine, testi, scadenze…"
        className={campo}
      />
      <label className="flex items-center gap-2 text-xs text-nebbia">
        <input type="checkbox" checked={urgente} onChange={(e) => setUrgente(e.target.checked)} className="accent-azione" /> È urgente
      </label>
      <button
        type="submit"
        disabled={bloccato || stato === 'invio' || testo.trim().length < 3}
        className="px-btn font-pixel text-base px-3 py-2.5 bg-azione text-ink"
      >
        {stato === 'invio' ? 'Invio…' : 'Invia richiesta'}
      </button>
      {stato === 'ok' && <p className="text-xs text-fatto">Ricevuta. Ti rispondo con una stima.</p>}
      {stato !== 'idle' && stato !== 'invio' && stato !== 'ok' && <p className="text-xs text-azione">{stato}</p>}
    </form>
  );
}

function StimaDaApprovare({ r, bloccato, onFatto }: { r: Richiesta; bloccato?: boolean; onFatto: () => void }) {
  const [busy, setBusy] = useState(false);
  const decidi = async (azione: 'approva' | 'rifiuta') => {
    setBusy(true);
    try {
      const res = await fetch(`/api/portale/richieste/${r.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ azione }),
      });
      if (res.ok) onFatto();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="bg-ink-3 px-notch-sm p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-pixel text-xl text-azione leading-none">{ore(r.ore_stimate)}</p>
        {r.sito && <span className="text-xs text-fumo truncate">{r.sito}</span>}
      </div>
      <p className="text-sm text-chiaro mt-2 line-clamp-3 whitespace-pre-wrap">{r.testo}</p>
      {r.consegna_prevista && <p className="text-xs text-nebbia mt-1">Consegna stimata {giorno(r.consegna_prevista)}</p>}
      {r.risposta && <p className="text-xs text-fumo mt-1 whitespace-pre-wrap">{r.risposta}</p>}
      <div className="flex items-center gap-2 mt-3">
        <button disabled={busy || bloccato} onClick={() => decidi('approva')} className="px-btn flex-1 font-pixel text-sm px-3 py-2 bg-azione text-ink">
          Approva
        </button>
        <button disabled={busy || bloccato} onClick={() => decidi('rifiuta')} className="px-btn font-pixel text-sm px-3 py-2 bg-ink-4 text-nebbia">
          Non ora
        </button>
      </div>
    </div>
  );
}
