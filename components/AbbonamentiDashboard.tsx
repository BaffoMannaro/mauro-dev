'use client';

import { useState } from 'react';

interface Abbonamento {
  id: number;
  nome: string;
  cifra: number;
  cadenza: string;
  data_inizio: string;
  data_fine: string | null;
  attivo: boolean;
  note: string | null;
}

const CADENZE = ['mensile', 'annuale', 'una tantum'];

const CADENZA_LABEL: Record<string, string> = {
  mensile: 'Mensile',
  annuale: 'Annuale',
  'una tantum': 'Una tantum',
};

function costoMensile(ab: Abbonamento): number {
  if (!ab.attivo) return 0;
  if (ab.cadenza === 'mensile') return Number(ab.cifra);
  if (ab.cadenza === 'annuale') return Number(ab.cifra) / 12;
  return 0;
}

function costoAnnuale(ab: Abbonamento): number {
  if (!ab.attivo) return 0;
  if (ab.cadenza === 'mensile') return Number(ab.cifra) * 12;
  if (ab.cadenza === 'annuale') return Number(ab.cifra);
  return 0;
}

function isScaduto(ab: Abbonamento): boolean {
  if (!ab.data_fine) return false;
  return new Date(ab.data_fine) < new Date();
}

export default function AbbonamentiDashboard({ abbonamenti: initial }: { abbonamenti: Abbonamento[] }) {
  const [abbonamenti, setAbbonamenti] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: '', cifra: '', cadenza: 'mensile',
    data_inizio: new Date().toISOString().slice(0, 10),
    data_fine: '', attivo: true, note: '',
  });
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState('');

  const totMensile = abbonamenti.reduce((s, ab) => s + costoMensile(ab), 0);
  const totAnnuale = abbonamenti.reduce((s, ab) => s + costoAnnuale(ab), 0);
  const totUnaVolta = abbonamenti.filter((ab) => ab.cadenza === 'una tantum' && ab.attivo).reduce((s, ab) => s + Number(ab.cifra), 0);

  const salva = async () => {
    setErrore('');
    if (!form.nome.trim()) return setErrore('Il nome è obbligatorio');
    if (!form.cifra || isNaN(Number(form.cifra))) return setErrore('Inserisci una cifra valida');
    setLoading(true);
    const res = await fetch('/api/abbonamenti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cifra: Number(form.cifra) }),
    });
    if (res.ok) {
      const data = await res.json();
      setAbbonamenti((prev) => [data, ...prev]);
      setForm({ nome: '', cifra: '', cadenza: 'mensile', data_inizio: new Date().toISOString().slice(0, 10), data_fine: '', attivo: true, note: '' });
      setShowForm(false);
    }
    setLoading(false);
  };

  const toggleAttivo = async (ab: Abbonamento) => {
    const res = await fetch(`/api/abbonamenti/${ab.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attivo: !ab.attivo }),
    });
    if (res.ok) {
      const data = await res.json();
      setAbbonamenti((prev) => prev.map((a) => a.id === ab.id ? data : a));
    }
  };

  const elimina = async (id: number) => {
    if (!confirm('Eliminare questo abbonamento?')) return;
    const res = await fetch(`/api/abbonamenti/${id}`, { method: 'DELETE' });
    if (res.ok) setAbbonamenti((prev) => prev.filter((a) => a.id !== id));
  };

  const fmt = (n: number) => `€${n.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-white font-semibold text-lg">Abbonamenti</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-white text-zinc-900 font-medium px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          + Nuovo
        </button>
      </header>

      <div className="px-6 py-8 max-w-3xl mx-auto flex flex-col gap-6">

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">COSTO MENSILE</p>
            <p className="text-red-400 text-2xl font-semibold">{fmt(totMensile)}</p>
            <p className="text-zinc-500 text-xs mt-1">abbonamenti attivi</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">COSTO ANNUALE</p>
            <p className="text-orange-400 text-2xl font-semibold">{fmt(totAnnuale)}</p>
            <p className="text-zinc-500 text-xs mt-1">proiezione 12 mesi</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-xs font-mono mb-2">UNA TANTUM</p>
            <p className="text-zinc-400 text-2xl font-semibold">{fmt(totUnaVolta)}</p>
            <p className="text-zinc-500 text-xs mt-1">spese singole attive</p>
          </div>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {abbonamenti.length === 0 && (
            <div className="text-center py-16 text-zinc-600">
              <p>Nessun abbonamento</p>
              <p className="text-sm mt-1">Clicca "+ Nuovo" per aggiungerne uno</p>
            </div>
          )}
          {abbonamenti.map((ab) => (
            <div
              key={ab.id}
              className={`bg-zinc-900 border rounded-xl p-5 transition-colors ${!ab.attivo || isScaduto(ab) ? 'border-zinc-800 opacity-50' : 'border-zinc-700'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ab.cadenza === 'mensile' ? 'text-blue-400 border-blue-800 bg-blue-950/30' :
                        ab.cadenza === 'annuale' ? 'text-purple-400 border-purple-800 bg-purple-950/30' :
                          'text-zinc-400 border-zinc-700 bg-zinc-800'
                      }`}>
                      {CADENZA_LABEL[ab.cadenza]}
                    </span>
                    {isScaduto(ab) && (
                      <span className="text-xs text-red-400 font-mono">Scaduto</span>
                    )}
                    {!ab.attivo && !isScaduto(ab) && (
                      <span className="text-xs text-zinc-500 font-mono">Disattivo</span>
                    )}
                  </div>
                  <p className="text-white font-medium">{ab.nome}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Dal {new Date(ab.data_inizio).toLocaleDateString('it-IT')}
                    {ab.data_fine && ` al ${new Date(ab.data_fine).toLocaleDateString('it-IT')}`}
                  </p>
                  {ab.note && <p className="text-zinc-500 text-xs mt-1">{ab.note}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-semibold">{fmt(Number(ab.cifra))}</p>
                  {ab.cadenza === 'mensile' && (
                    <p className="text-zinc-500 text-xs">{fmt(Number(ab.cifra) * 12)}/anno</p>
                  )}
                  {ab.cadenza === 'annuale' && (
                    <p className="text-zinc-500 text-xs">{fmt(Number(ab.cifra) / 12)}/mese</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => toggleAttivo(ab)}
                  className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  {ab.attivo ? 'Disattiva' : 'Attiva'}
                </button>
                <button
                  onClick={() => elimina(ab.id)}
                  className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-red-950 text-red-400 rounded-lg transition-colors ml-auto"
                >
                  Elimina
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal nuovo abbonamento */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold">Nuovo abbonamento</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-zinc-500 text-xs font-mono block mb-1">NOME *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="es. Vercel Pro, GitHub, Adobe..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs font-mono block mb-1">CIFRA (€) *</label>
                  <input
                    type="number"
                    value={form.cifra}
                    onChange={(e) => setForm({ ...form, cifra: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-mono block mb-1">CADENZA *</label>
                  <select
                    value={form.cadenza}
                    onChange={(e) => setForm({ ...form, cadenza: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  >
                    {CADENZE.map((c) => (
                      <option key={c} value={c}>{CADENZA_LABEL[c]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-500 text-xs font-mono block mb-1">DATA INIZIO *</label>
                  <input
                    type="date"
                    value={form.data_inizio}
                    onChange={(e) => setForm({ ...form, data_inizio: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-500 text-xs font-mono block mb-1">DATA FINE</label>
                  <input
                    type="date"
                    value={form.data_fine}
                    onChange={(e) => setForm({ ...form, data_fine: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-zinc-500 text-xs font-mono block mb-1">NOTE</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Opzionale"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>
              {errore && <p className="text-red-400 text-xs font-mono">⚠ {errore}</p>}
              <button
                onClick={salva}
                disabled={loading}
                className="w-full bg-white text-zinc-900 font-medium py-3 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-30 mt-2"
              >
                {loading ? 'Salvataggio...' : 'Salva abbonamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}