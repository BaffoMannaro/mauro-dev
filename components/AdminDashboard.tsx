'use client';

import { useState } from 'react';
import NuovoPreventivo from './NuovoPreventivo';
import PreventivoDrawer from './PreventivoDrawer';

interface Voce {
  descrizione: string;
  quantita: number;
  prezzo: number;
}

interface Preventivo {
  id: number;
  token: string;
  cliente_nome: string;
  cliente_azienda: string | null;
  cliente_email: string;
  oggetto: string;
  voci: Voce[];
  note: string | null;
  scadenza: string | null;
  totale: number;
  iva: boolean;
  stato: string;
  accettato_at: string | null;
  accettato_ip: string | null;
  accettato_ua: string | null;
  accettato_nome: string | null;
  accettato_cognome: string | null;
  accettato_email: string | null;
  tranches_stato: any;
  lavoro_inizio: string | null;
  lavoro_fine: string | null;
  created_at: string;
  meta?: any;
}

const STATI = {
  inviato:   { label: 'Inviato',    color: 'text-blue-400 bg-blue-950/40 border-blue-800/60' },
  accettato: { label: 'Accettato',  color: 'text-green-400 bg-green-950/40 border-green-800/60' },
  rifiutato: { label: 'Rifiutato',  color: 'text-red-400 bg-red-950/40 border-red-800/60' },
  archiviato:{ label: 'Archiviato', color: 'text-dim bg-surface2 border-edge' },
};

const ORDINE_STATI: Record<string, number> = {
  inviato: 0, accettato: 1, rifiutato: 2, archiviato: 3,
};

export default function AdminDashboard({
  preventivi: initialPreventivi,
  session,
}: {
  preventivi: Preventivo[];
  session: any;
}) {
  const [preventivi, setPreventivi] = useState(initialPreventivi);
  const [filtro, setFiltro] = useState('tutti');
  const [copiato, setCopiato] = useState<string | null>(null);
  const [nuovoOpen, setNuovoOpen] = useState(false);
  const [drawerPreventivo, setDrawerPreventivo] = useState<Preventivo | null>(null);

  const filtrati = [...(filtro === 'tutti' ? preventivi : preventivi.filter((p) => p.stato === filtro))]
    .sort((a, b) => {
      const dStato = (ORDINE_STATI[a.stato] ?? 99) - (ORDINE_STATI[b.stato] ?? 99);
      if (dStato !== 0) return dStato;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const copiaLink = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/p/${token}`);
    setCopiato(token);
    setTimeout(() => setCopiato(null), 2000);
  };

  const aggiornaStato = async (id: number, stato: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/preventivi/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato }),
    });
    if (res.ok) {
      setPreventivi((prev) => prev.map((p) => (p.id === id ? { ...p, stato } : p)));
    }
  };

  const eliminaPreventivo = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Sei sicuro di voler eliminare questo preventivo?')) return;
    const res = await fetch(`/api/preventivi/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPreventivi((prev) => prev.filter((p) => p.id !== id));
      if (drawerPreventivo?.id === id) setDrawerPreventivo(null);
    }
  };

  const ricaricaPreventivi = async () => {
    const res = await fetch('/api/preventivi');
    if (res.ok) setPreventivi(await res.json());
  };

  const aggiornaPreventivo = (updated: Preventivo) => {
    setPreventivi((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setDrawerPreventivo(updated);
  };

  /* KPI header */
  const kpi = [
    { label: 'Inviati',    count: preventivi.filter(p => p.stato === 'inviato').length,    color: 'text-blue-400' },
    { label: 'Accettati',  count: preventivi.filter(p => p.stato === 'accettato').length,   color: 'text-green-400' },
    { label: 'Rifiutati',  count: preventivi.filter(p => p.stato === 'rifiutato').length,   color: 'text-red-400' },
    { label: 'Archiviati', count: preventivi.filter(p => p.stato === 'archiviato').length,  color: 'text-dim' },
  ];

  const FILTRI = ['tutti', 'inviato', 'accettato', 'rifiutato', 'archiviato'];

  return (
    <div className="min-h-screen text-text">

      {/* Header stile Crextio: titolo sx, KPI + CTA dx */}
      <header className="border-b border-edge px-6 py-5 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Preventivi</h1>
        <div className="flex items-center gap-6">
          {kpi.map((k) => (
            <div key={k.label} className="text-center hidden sm:block">
              <p className={`text-2xl font-bold ${k.color}`}>{k.count}</p>
              <p className="text-dim text-xs">{k.label}</p>
            </div>
          ))}
          <button
            onClick={() => setNuovoOpen(true)}
            className="ml-2 text-sm bg-accent text-white font-semibold px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            + Nuovo
          </button>
        </div>
      </header>

      <div className="px-6 py-6 max-w-6xl mx-auto">

        {/* Filtri */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTRI.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                filtro === f
                  ? 'bg-accent text-white'
                  : 'bg-surface2 text-muted border border-edge hover:text-text hover:border-slate'
              }`}
            >
              {f === 'tutti' ? 'Tutti' : STATI[f as keyof typeof STATI].label}
              <span className="ml-2 text-xs opacity-60">
                {f === 'tutti' ? preventivi.length : preventivi.filter((p) => p.stato === f).length}
              </span>
            </button>
          ))}
        </div>

        {/* Lista */}
        {filtrati.length === 0 ? (
          <div className="text-center py-24 text-dim">
            <p className="text-lg font-medium">Nessun preventivo</p>
            <p className="text-sm mt-1">I preventivi caricati appariranno qui</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtrati.map((p) => (
              <div
                key={p.id}
                onClick={() => setDrawerPreventivo(p)}
                className="bg-surface border border-edge rounded-xl p-5 cursor-pointer hover:border-slate transition-colors"
              >
                {/* Top row: badge + totale */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATI[p.stato as keyof typeof STATI]?.color}`}>
                        {STATI[p.stato as keyof typeof STATI]?.label}
                      </span>
                    </div>
                    <h3 className="text-text font-semibold truncate">{p.cliente_nome}</h3>
                    <p className="text-muted text-sm">{p.oggetto}</p>
                    <p className="text-dim text-xs mt-1">
                      {new Date(p.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {p.accettato_at && ` · Acc. ${new Date(p.accettato_at).toLocaleDateString('it-IT')}`}
                      {p.lavoro_inizio && ` · ${new Date(p.lavoro_inizio).toLocaleDateString('it-IT')}`}
                      {p.lavoro_fine && ` → ${new Date(p.lavoro_fine).toLocaleDateString('it-IT')}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-text font-bold text-xl">
                      €{Number(p.totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-dim text-xs mt-0.5">{p.iva ? 'IVA inclusa' : 'Esente IVA'}</p>
                  </div>
                </div>

                {/* Tranches */}
                {(() => {
                  const tranches: { descrizione: string; percentuale: number; pagato: boolean }[] =
                    p.tranches_stato && p.tranches_stato.length > 0
                      ? p.tranches_stato
                      : p.meta?.sezioni?.tranches?.length > 0
                        ? p.meta.sezioni.tranches.map((t: any) => ({ ...t, pagato: false }))
                        : null;
                  if (!tranches) return null;
                  const percPagata = tranches.filter((t) => t.pagato).reduce((s, t) => s + t.percentuale, 0);
                  return (
                    <div className="mt-3 pt-3 border-t border-edge flex flex-col gap-1.5">
                      {tranches.map((t, i) => {
                        const importo = Math.round(Number(p.totale) * t.percentuale / 100);
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={t.pagato ? 'text-green-400' : 'text-dim'}>
                                {t.pagato ? '✓' : '○'}
                              </span>
                              <span className={t.pagato ? 'text-muted' : 'text-dim'}>{t.descrizione}</span>
                            </div>
                            <span className={`font-medium ${t.pagato ? 'text-green-400' : 'text-accent'}`}>
                              €{importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                      {percPagata > 0 && (
                        <div className="mt-1 h-0.5 bg-edge rounded-full overflow-hidden">
                          <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${percPagata}%` }} />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Azioni */}
                <div className="flex gap-2 mt-4 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => copiaLink(p.token, e)}
                    className="text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors cursor-pointer"
                  >
                    {copiato === p.token ? '✓ Copiato!' : 'Copia link'}
                  </button>
                  <a
                    href={`/p/${p.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors cursor-pointer"
                  >
                    Visualizza
                  </a>
                  {p.stato === 'inviato' && (
                    <>
                      <button
                        onClick={(e) => aggiornaStato(p.id, 'rifiutato', e)}
                        className="text-xs px-3 py-1.5 bg-surface2 hover:bg-red-950/50 text-red-400 rounded-lg transition-colors cursor-pointer"
                      >
                        Rifiutato
                      </button>
                      <button
                        onClick={(e) => aggiornaStato(p.id, 'archiviato', e)}
                        className="text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors cursor-pointer"
                      >
                        Archivia
                      </button>
                    </>
                  )}
                  {p.stato === 'accettato' && (
                    <button
                      onClick={(e) => aggiornaStato(p.id, 'archiviato', e)}
                      className="text-xs px-3 py-1.5 bg-surface2 hover:bg-slate text-muted hover:text-text rounded-lg transition-colors cursor-pointer"
                    >
                      Archivia
                    </button>
                  )}
                  {p.stato === 'archiviato' && (
                    <button
                      onClick={(e) => aggiornaStato(p.id, 'accettato', e)}
                      className="text-xs px-3 py-1.5 bg-surface2 hover:bg-green-950/50 text-green-400 rounded-lg transition-colors cursor-pointer"
                    >
                      Riattiva
                    </button>
                  )}
                  <button
                    onClick={(e) => eliminaPreventivo(p.id, e)}
                    className="text-xs px-3 py-1.5 bg-surface2 hover:bg-red-950/50 text-red-400 rounded-lg transition-colors cursor-pointer ml-auto"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {nuovoOpen && (
        <NuovoPreventivo onClose={() => setNuovoOpen(false)} onSuccess={ricaricaPreventivi} />
      )}
      {drawerPreventivo && (
        <PreventivoDrawer
          preventivo={drawerPreventivo}
          onClose={() => setDrawerPreventivo(null)}
          onUpdate={aggiornaPreventivo}
        />
      )}
    </div>
  );
}
