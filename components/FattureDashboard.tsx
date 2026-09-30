'use client';

import { useEffect, useRef, useState } from 'react';
import { extractXml, parseFattura, TIPO_DOCUMENTO, type Fattura } from '@/lib/fattura/parse';
import { renderFatturaHtml, nomeFilePdf, dataLunga, eur } from '@/lib/fattura/html';

interface Caricata {
  id: string;
  fileName: string;
  xml: string;
  fattura: Fattura | null;
  errore: string | null;
}

// A4 a 96 dpi
const A4_W = 794;
const A4_H = 1123;

function Anteprima({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / A4_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full">
      <div
        className="mx-auto rounded-lg overflow-hidden shadow-2xl ring-1 ring-edge bg-white"
        style={{ width: A4_W * scale, height: A4_H * scale }}
      >
        <iframe
          title="Anteprima fattura"
          srcDoc={html}
          style={{ width: A4_W, height: A4_H, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }}
        />
      </div>
    </div>
  );
}

export default function FattureDashboard() {
  const [items, setItems] = useState<Caricata[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [erroreDownload, setErroreDownload] = useState('');
  const [conLogo, setConLogo] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const carica = async (files: FileList | File[]) => {
    const nuove: Caricata[] = await Promise.all(
      Array.from(files).map(async (file) => {
        const id = crypto.randomUUID();
        try {
          const xml = extractXml(new Uint8Array(await file.arrayBuffer()));
          return { id, fileName: file.name, xml, fattura: parseFattura(xml), errore: null };
        } catch (e) {
          return { id, fileName: file.name, xml: '', fattura: null, errore: (e as Error).message };
        }
      })
    );
    setItems((prev) => [...nuove, ...prev]);
    const primaValida = nuove.find((n) => n.fattura);
    if (primaValida) setSelectedId(primaValida.id);
  };

  const scarica = async (item: Caricata) => {
    if (!item.fattura) return;
    setDownloading(item.id);
    setErroreDownload('');
    try {
      const res = await fetch(`/api/fatture/pdf${conLogo ? '' : '?logo=0'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: item.xml,
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(error);
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = nomeFilePdf(item.fattura);
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErroreDownload((e as Error).message);
    }
    setDownloading(null);
  };

  const rimuovi = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const selected = items.find((i) => i.id === selectedId && i.fattura);

  return (
    <div className="min-h-screen text-text">

      <header className="border-b border-edge px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Fatture</h1>
          <p className="text-dim text-sm mt-0.5">Carica l’XML dell’Agenzia delle Entrate e scarica la copia di cortesia brandizzata.</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <span className="text-sm text-muted">Logo nel PDF</span>
          <button
            type="button"
            role="switch"
            aria-checked={conLogo}
            onClick={() => setConLogo((v) => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${conLogo ? 'bg-accent' : 'bg-edge'}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${conLogo ? 'translate-x-4' : ''}`}
            />
          </button>
        </label>
      </header>

      <div className="px-6 py-6 max-w-7xl mx-auto grid gap-6 lg:grid-cols-[360px_1fr] items-start">

        {/* ── Colonna sinistra: upload + elenco ── */}
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files.length) carica(e.dataTransfer.files);
            }}
            className={`w-full border-2 border-dashed rounded-xl px-5 py-8 text-center transition-colors cursor-pointer ${
              dragging ? 'border-accent bg-accent/5' : 'border-edge hover:border-slate bg-surface'
            }`}
          >
            <svg className="w-7 h-7 mx-auto text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-semibold mt-3">Trascina qui le fatture</p>
            <p className="text-dim text-xs mt-1">oppure clicca per sceglierle · .xml (anche .p7m)</p>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xml,.p7m,application/xml,text/xml"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files?.length) carica(e.target.files);
              e.target.value = '';
            }}
          />

          {erroreDownload && (
            <p className="text-red-400 text-xs font-mono">⚠ {erroreDownload}</p>
          )}

          {items.map((item) => {
            const f = item.fattura;
            const active = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => f && setSelectedId(item.id)}
                className={`bg-surface border rounded-xl px-4 py-3.5 transition-colors ${
                  f ? 'cursor-pointer hover:bg-surface2/50' : ''
                } ${active ? 'border-accent' : 'border-edge'}`}
              >
                {f ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-dim text-xs">
                        {TIPO_DOCUMENTO[f.tipoDocumento] ?? 'Fattura'} n. {f.numero} · {dataLunga(f.data)}
                      </p>
                      <p className="text-text font-semibold text-sm truncate mt-0.5">{f.committente.nome}</p>
                      <p className="text-accent font-bold text-sm mt-1">
                        {eur(f.totaleDocumento)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); scarica(item); }}
                        disabled={downloading === item.id}
                        title="Scarica PDF"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {downloading === item.id ? '...' : 'PDF'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); rimuovi(item.id); }}
                        title="Rimuovi"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-text hover:bg-surface2 transition-colors cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-text text-sm truncate">{item.fileName}</p>
                      <p className="text-red-400 text-xs mt-1">{item.errore}</p>
                    </div>
                    <button
                      onClick={() => rimuovi(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-text hover:bg-surface2 transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Colonna destra: anteprima ── */}
        <div className="min-w-0">
          {selected?.fattura ? (
            <Anteprima html={renderFatturaHtml(selected.fattura, { logo: conLogo })} />
          ) : (
            <div className="border border-edge rounded-xl bg-surface flex items-center justify-center text-dim text-sm aspect-[210/297] max-h-[70vh] mx-auto">
              L’anteprima della fattura apparirà qui
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
