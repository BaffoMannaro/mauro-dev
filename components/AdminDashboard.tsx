'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import NuovoPreventivo from './NuovoPreventivo';

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
  created_at: string;
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
  const ricaricaPreventivi = async () => {
    const res = await fetch('/api/preventivi');
    if (res.ok) {
      const data = await res.json();
      setPreventivi(data);
    }
  };

  const filtrati = filtro === 'tutti'
    ? preventivi
    : preventivi.filter((p) => p.stato === filtro);

  const copiaLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${token}`);
    setCopiato(token);
    setTimeout(() => setCopiato(null), 2000);
  };

  const aggiornaStato = async (id: number, stato: string) => {
    const res = await fetch(`/api/preventivi/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato }),
    });
    if (res.ok) {
      setPreventivi((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stato } : p))
      );
    }
  };

  const eliminaPreventivo = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo preventivo?')) return;
    const res = await fetch(`/api/preventivi/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPreventivi((prev) => prev.filter((p) => p.id !== id));
    }
  };



  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {nuovoOpen && <NuovoPreventivo onClose={() => setNuovoOpen(false)} onSuccess={ricaricaPreventivi} />}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-zinc-400 text-sm font-mono">maurodev.it</span>
          <h1 className="text-white font-semibold text-lg">Preventivi</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-500 text-sm">{session?.user?.email}</span>
          <button
            onClick={() => setNuovoOpen(true)}
            className="text-sm bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            + Nuovo
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Esci
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
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

        {filtrati.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-lg">Nessun preventivo</p>
            <p className="text-sm mt-1">I preventivi caricati appariranno qui</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtrati.map((p) => (
              <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="text-zinc-500 text-xs font-mono">#{p.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATI[p.stato as keyof typeof STATI]?.color}`}>
                        {STATI[p.stato as keyof typeof STATI]?.label}
                      </span>
                    </div>
                    <h3 className="text-white font-medium truncate">{p.oggetto}</h3>
                    <p className="text-zinc-400 text-sm">
                      {p.cliente_nome}
                      {p.cliente_azienda && ` · ${p.cliente_azienda}`}
                    </p>
                    <p className="text-zinc-500 text-xs mt-1">
                      {new Date(p.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {p.accettato_at && ` · Accettato il ${new Date(p.accettato_at).toLocaleDateString('it-IT')}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold text-lg">
                      {`€${(Number(p.totale) * (p.iva ? 1.22 : 1)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
                    </p>
                    {p.iva && <p className="text-zinc-500 text-xs">IVA inclusa</p>}
                  </div>
                </div>

                <div className="flex gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => copiaLink(p.token)}
                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    {copiato === p.token ? '✓ Copiato!' : 'Copia link'}
                  </button>
                  
                  <a href={`/p/${p.token}`} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors">Visualizza</a>
                  {p.stato === 'inviato' && (
                    <>
                      <button
                        onClick={() => aggiornaStato(p.id, 'rifiutato')}
                        className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-red-950 text-red-400 rounded-lg transition-colors"
                      >
                        Segna rifiutato
                      </button>
                      <button
                        onClick={() => aggiornaStato(p.id, 'archiviato')}
                        className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        Archivia
                      </button>
                    </>
                  )}
                  {p.stato === 'accettato' && (
                    <button
                      onClick={() => aggiornaStato(p.id, 'archiviato')}
                      className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                      Archivia
                    </button>
                  )}
                  <button
                    onClick={() => eliminaPreventivo(p.id)}
                    className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-red-950 text-red-400 rounded-lg transition-colors ml-auto"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
