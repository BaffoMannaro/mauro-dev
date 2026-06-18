'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const JSON_ESEMPIO = {
  "cliente": {
    "nome": "Rossi Srl",
    "piva": "01234567890",
    "email": "mario@rossisrl.it",
    "telefono": "339 1234567"
  },
  "preventivo": {
    "oggetto": "Sviluppo Sito Web Aziendale",
    "data": "18 Giugno 2026",
    "scadenza": "2026-07-31",
    "iva": true,
    "modalita_pagamento": "Bonifico bancario",
    "schema_pagamento": "50/50"
  },
  "sezioni": {
    "intro": "Gentile cliente, di seguito il preventivo per il progetto discusso.",
    "voci": {
      "modalita": "lista",
      "items": [
        { "descrizione": "Design UI/UX", "quantita": 1, "prezzo": 1200 },
        { "descrizione": "Sviluppo Frontend", "quantita": 1, "prezzo": 2400 }
      ]
    },
    "tranches": [
      { "descrizione": "Acconto alla firma (50%)", "percentuale": 50 },
      { "descrizione": "Saldo alla consegna (50%)", "percentuale": 50 }
    ],
    "tempi": "Consegna stimata: 4 settimane dalla firma.",
    "garanzia": "30 giorni di supporto post-lancio inclusi.",
    "esclusioni": ["Copywriting dei testi", "Foto e immagini professionali"],
    "manutenzione": { "descrizione": "Piano manutenzione mensile.", "prezzo": 80 },
    "fasi_successive": "Possibile evoluzione con e-commerce nella fase 2.",
    "note": "Il preventivo include revisioni illimitate nella fase di design."
  }
};

export default function NuovoPreventivo({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [json, setJson] = useState('');
  const [errore, setErrore] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const validaJSON = (testo: string) => {
    try {
      const parsed = JSON.parse(testo);
      if (!parsed.cliente?.nome) throw new Error('Campo cliente.nome obbligatorio');
      if (!parsed.cliente?.email) throw new Error('Campo cliente.email obbligatorio');
      if (!parsed.preventivo?.oggetto) throw new Error('Campo preventivo.oggetto obbligatorio');
      if (!parsed.sezioni?.voci?.items?.length) throw new Error('Sezione sezioni.voci.items obbligatoria');
      return parsed;
    } catch (e: any) {
      throw new Error(e.message);
    }
  };

  const handlePreview = () => {
    setErrore('');
    try {
      const parsed = validaJSON(json);
      setPreview(parsed);
    } catch (e: any) {
      setErrore(e.message);
    }
  };

  const handleCarica = async () => {
    setErrore('');
    setLoading(true);
    try {
      const parsed = validaJSON(json);
      const voci = parsed.sezioni.voci.items;
      const totale = voci.reduce((acc: number, v: any) => acc + v.quantita * v.prezzo, 0);

      const res = await fetch('/api/preventivi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: {
            nome: parsed.cliente.nome,
            azienda: parsed.cliente.nome,
            email: parsed.cliente.email,
          },
          oggetto: parsed.preventivo.oggetto,
          voci,
          note: [
            parsed.sezioni.intro,
            parsed.sezioni.tempi,
            parsed.sezioni.garanzia,
            parsed.sezioni.note,
            parsed.sezioni.fasi_successive,
            parsed.sezioni.esclusioni ? 'Non incluso: ' + parsed.sezioni.esclusioni.join(', ') : null,
            parsed.sezioni.manutenzione ? `Manutenzione: ${parsed.sezioni.manutenzione.descrizione} €${parsed.sezioni.manutenzione.prezzo}/mese` : null,
          ].filter(Boolean).join('\n\n'),
          scadenza: parsed.preventivo.scadenza,
          iva: parsed.preventivo.iva !== false,
          meta: parsed,
        }),
      });

      if (!res.ok) throw new Error('Errore nel caricamento');
      const data = await res.json();
      router.refresh();
      onClose();
    } catch (e: any) {
      setErrore(e.message);
    }
    setLoading(false);
  };

  const imponibile = preview
    ? preview.sezioni.voci.items.reduce((acc: number, v: any) => acc + v.quantita * v.prezzo, 0)
    : 0;
  const iva = preview?.preventivo?.iva !== false ? imponibile * 0.22 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-semibold">Nuovo preventivo</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Editor JSON */}
          <div className="p-6 border-r border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-400 text-sm font-mono">JSON PREVENTIVO</p>
              <button
                onClick={() => setJson(JSON.stringify(JSON_ESEMPIO, null, 2))}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Carica esempio
              </button>
            </div>
            <textarea
              value={json}
              onChange={(e) => { setJson(e.target.value); setPreview(null); setErrore(''); }}
              placeholder='Incolla qui il JSON generato da Claude...'
              className="w-full h-96 bg-zinc-950 border border-zinc-700 rounded-xl p-4 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
            />
            {errore && (
              <p className="text-red-400 text-xs mt-2 font-mono">⚠ {errore}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handlePreview}
                disabled={!json.trim()}
                className="flex-1 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-30 transition-colors"
              >
                Anteprima
              </button>
              <button
                onClick={handleCarica}
                disabled={!json.trim() || loading}
                className="flex-1 py-2 text-sm bg-white hover:bg-zinc-100 text-zinc-900 font-medium rounded-lg disabled:opacity-30 transition-colors"
              >
                {loading ? 'Caricamento...' : 'Carica preventivo'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="p-6">
            <p className="text-zinc-400 text-sm font-mono mb-3">ANTEPRIMA</p>
            {!preview ? (
              <div className="h-96 flex items-center justify-center text-zinc-600 text-sm">
                Clicca "Anteprima" per vedere il risultato
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1">
                {/* Cliente */}
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs font-mono mb-2">CLIENTE</p>
                  <p className="text-white font-medium">{preview.cliente.nome}</p>
                  {preview.cliente.piva && <p className="text-zinc-400 text-sm">P.IVA {preview.cliente.piva}</p>}
                  <p className="text-zinc-400 text-sm">{preview.cliente.email}</p>
                  {preview.cliente.telefono && <p className="text-zinc-400 text-sm">{preview.cliente.telefono}</p>}
                </div>

                {/* Oggetto */}
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs font-mono mb-1">OGGETTO</p>
                  <p className="text-white">{preview.preventivo.oggetto}</p>
                  {preview.preventivo.scadenza && (
                    <p className="text-zinc-400 text-xs mt-1">Scadenza: {new Date(preview.preventivo.scadenza).toLocaleDateString('it-IT')}</p>
                  )}
                </div>

                {/* Intro */}
                {preview.sezioni.intro && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-1">INTRODUZIONE</p>
                    <p className="text-zinc-300 text-sm">{preview.sezioni.intro}</p>
                  </div>
                )}

                {/* Voci */}
                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-zinc-500 text-xs font-mono mb-2">VOCI</p>
                  {preview.sezioni.voci.items.map((v: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-1 border-b border-zinc-700 last:border-0">
                      <span className="text-zinc-300">{v.descrizione}</span>
                      <span className="text-white">€{(v.quantita * v.prezzo).toLocaleString('it-IT')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-2 mt-1">
                    <span className="text-zinc-400">Imponibile</span>
                    <span className="text-white">€{imponibile.toLocaleString('it-IT')}</span>
                  </div>
                  {preview.preventivo.iva !== false && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">IVA 22%</span>
                      <span className="text-white">€{iva.toLocaleString('it-IT')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t border-zinc-600 mt-1">
                    <span className="text-white">Totale</span>
                    <span className="text-white">€{(imponibile + iva).toLocaleString('it-IT')}</span>
                  </div>
                </div>

                {/* Tranches */}
                {preview.sezioni.tranches?.length > 0 && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-2">PAGAMENTO</p>
                    {preview.sezioni.tranches.map((t: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm py-1">
                        <span className="text-zinc-300">{t.descrizione}</span>
                        <span className="text-white">€{Math.round((imponibile + iva) * t.percentuale / 100).toLocaleString('it-IT')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sezioni opzionali */}
                {preview.sezioni.tempi && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-1">TEMPI</p>
                    <p className="text-zinc-300 text-sm">{preview.sezioni.tempi}</p>
                  </div>
                )}
                {preview.sezioni.garanzia && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-1">GARANZIA</p>
                    <p className="text-zinc-300 text-sm">{preview.sezioni.garanzia}</p>
                  </div>
                )}
                {preview.sezioni.esclusioni?.length > 0 && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-2">NON INCLUSO</p>
                    {preview.sezioni.esclusioni.map((e: string, i: number) => (
                      <p key={i} className="text-zinc-300 text-sm">· {e}</p>
                    ))}
                  </div>
                )}
                {preview.sezioni.manutenzione && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-1">MANUTENZIONE</p>
                    <p className="text-zinc-300 text-sm">{preview.sezioni.manutenzione.descrizione}</p>
                    <p className="text-white text-sm font-medium mt-1">€{preview.sezioni.manutenzione.prezzo}/mese</p>
                  </div>
                )}
                {preview.sezioni.fasi_successive && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-1">SVILUPPI FUTURI</p>
                    <p className="text-zinc-300 text-sm">{preview.sezioni.fasi_successive}</p>
                  </div>
                )}
                {preview.sezioni.note && (
                  <div className="bg-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-500 text-xs font-mono mb-1">NOTE</p>
                    <p className="text-zinc-300 text-sm">{preview.sezioni.note}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
