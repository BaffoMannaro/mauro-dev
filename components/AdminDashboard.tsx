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
  inviato: { label: 'Inviato', color: 'text-blue-400 bg-blue-950/40 border-blue-800' },
  accettato: { label: 'Accettato', color: 'text-green-400 bg-green-950/40 border-green-800' },
  rifiutato: { label: 'Rifiutato', color: 'text-red-400 bg-red-950/40 border-red-800' },
  archiviato: { label: 'Archiviato', color: 'text-zinc-400 bg-zinc-900 border-zinc-700' },
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

  const filtrati = filtro === 'tutti'
    ? preventivi
    : preventivi.filter((p) => p.stato === filtro);

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
    if (res.ok) {
      const data = await res.json();
      setPreventivi(data);
    }
  };

  const aggiornaPreventivo = (updated: Preventivo) => {
    setPreventivi((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setDrawerPreventivo(updated);
  };

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-semibold text-lg">Preventivi</h1>
        <button
          onClick={() => setNuovoOpen(true)}
          className="text-sm bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          + Nuovo
        </button>
      </header>

      <div className="px-6 py-8 max-w-5xl mx-auto">
        {/* Filtri */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['tutti', 'inviato', 'accettato', 'rifiutato', 'archiviato'].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-colors ${
                filtro === f
                  ? 'bg-white text-zinc-900 font-medium'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
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
          <div className="text-center py-20 text-zinc-600">
            <p className="text-lg">Nessun preventivo</p>
            <p className="text-sm mt-1">I preventivi caricati appariranno qui</p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtrati.map((p) => (
              <div
                key={p.id}
                onClick={() => setDrawerPreventivo(p)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATI[p.stato as keyof typeof STATI]?.color}`}>
                        {STATI[p.stato as keyof typeof STATI]?.label}
                      </span>
                    </div>
                    <h3 className="text-white font-medium truncate">{p.cliente_nome}</h3>
                    <p className="text-zinc-400 text-sm">{p.oggetto}</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {new Date(p.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {p.accettato_at && ` · Accettato il ${new Date(p.accettato_at).toLocaleDateString('it-IT')}`}
                      {p.lavoro_inizio && ` · Lavoro: ${new Date(p.lavoro_inizio).toLocaleDateString('it-IT')}`}
                      {p.lavoro_fine && ` → ${new Date(p.lavoro_fine).toLocaleDateString('it-IT')}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-bold text-xl">
                      €{Number(p.totale).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-zinc-600 text-xs mt-0.5">{p.iva ? 'IVA inclusa' : 'Esente IVA'}</p>
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
                    <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-1.5">
                      {tranches.map((t, i) => {
                        const importo = Math.round(Number(p.totale) * t.percentuale / 100);
                        return (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={t.pagato ? 'text-green-400' : 'text-zinc-600'}>
                                {t.pagato ? '✓' : '○'}
                              </span>
                              <span className={t.pagato ? 'text-zinc-300' : 'text-zinc-500'}>{t.descrizione}</span>
                            </div>
                            <span className={`font-medium ${t.pagato ? 'text-green-400' : 'text-amber-400'}`}>
                              €{importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        );
                      })}
                      {percPagata > 0 && (
                        <div className="mt-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
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
                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    {copiato === p.token ? '✓ Copiato!' : 'Copia link'}
                  </button>
                  
                  <a href={`/p/${p.token}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Visualizza</a>
                  {p.stato === 'inviato' && (
                    <>
                      <button
                        onClick={(e) => aggiornaStato(p.id, 'rifiutato', e)}
                        className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-red-950 text-red-400 rounded-lg transition-colors"
                      >
                        Segna rifiutato
                      </button>
                      <button
                        onClick={(e) => aggiornaStato(p.id, 'archiviato', e)}
                        className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        Archivia
                      </button>
                    </>
                  )}
                  {p.stato === 'accettato' && (
                    <button
                      onClick={(e) => aggiornaStato(p.id, 'archiviato', e)}
                      className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      Archivia
                    </button>
                  )}
                  <button
                    onClick={(e) => eliminaPreventivo(p.id, e)}
                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-red-950 text-red-400 rounded-lg transition-colors ml-auto"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modali */}
      {nuovoOpen && (
        <NuovoPreventivo
          onClose={() => setNuovoOpen(false)}
          onSuccess={ricaricaPreventivi}
        />
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
