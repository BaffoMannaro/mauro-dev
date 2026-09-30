'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { extractXml, parseFattura, TIPO_DOCUMENTO, type Fattura } from '@/lib/fattura/parse';
import { renderFatturaHtml, nomeFilePdf, dataLunga, eur } from '@/lib/fattura/html';
import FattureAnalisi from './FattureAnalisi';

/** Riga dell'archivio (tabella fatture, solo quelle importate da XML). */
export interface FatturaSalvata {
  id: number;
  numero: string;
  data: string;
  anno: number;
  importo: number;
  imponibile: number | null;
  contributo: number | null;
  stato: 'pagata' | 'da_pagare';
  cliente_id: number | null;
  cliente_nome: string;
  cliente_piva: string | null;
  con_logo: boolean;
  xml: string;
}

interface Caricata {
  id: string;
  fileName: string;
  xml: string;
  fattura: Fattura | null;
  errore: string | null;
  conLogo: boolean;
}

type Selezione = { tipo: 'nuova'; id: string } | { tipo: 'salvata'; id: number } | null;

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

function IconDownload() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

const btnIcon = 'w-7 h-7 flex items-center justify-center rounded-lg text-dim hover:text-text hover:bg-surface2 transition-colors cursor-pointer';
const btnGhost = 'flex items-center gap-1.5 px-2.5 py-1.5 border border-edge text-muted hover:text-text hover:border-slate text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer';
const btnAccent = 'flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 text-on-accent text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors cursor-pointer';

export default function FattureDashboard({ archivio: iniziale }: { archivio: FatturaSalvata[] }) {
  const [items, setItems] = useState<Caricata[]>([]);
  const [archivio, setArchivio] = useState<FatturaSalvata[]>(iniziale);
  const [sel, setSel] = useState<Selezione>(null);
  const [logoDefault, setLogoDefault] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [errore, setErrore] = useState('');
  const [cerca, setCerca] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Selezione corrente ──
  const nuovaSel = sel?.tipo === 'nuova' ? items.find((i) => i.id === sel.id && i.fattura) : undefined;
  const salvataSel = sel?.tipo === 'salvata' ? archivio.find((r) => r.id === sel.id) : undefined;
  const fatturaSel = useMemo(() => {
    if (nuovaSel) return nuovaSel.fattura;
    if (!salvataSel) return null;
    try { return parseFattura(salvataSel.xml); } catch { return null; }
  }, [nuovaSel, salvataSel]);
  const conLogo = nuovaSel ? nuovaSel.conLogo : salvataSel ? salvataSel.con_logo : logoDefault;

  const inArchivio = (f: Fattura) => archivio.find((r) => r.numero === f.numero && r.anno === Number(f.data.slice(0, 4)));

  const archivioFiltrato = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    if (!q) return archivio;
    return archivio.filter((r) => r.cliente_nome.toLowerCase().includes(q) || r.numero.includes(q) || r.data.includes(q));
  }, [archivio, cerca]);

  // ── Azioni ──
  const carica = async (files: FileList | File[]) => {
    const nuove: Caricata[] = await Promise.all(
      Array.from(files).map(async (file) => {
        const id = crypto.randomUUID();
        try {
          const xml = extractXml(new Uint8Array(await file.arrayBuffer()));
          return { id, fileName: file.name, xml, fattura: parseFattura(xml), errore: null, conLogo: logoDefault };
        } catch (e) {
          return { id, fileName: file.name, xml: '', fattura: null, errore: (e as Error).message, conLogo: logoDefault };
        }
      })
    );
    setItems((prev) => [...nuove, ...prev]);
    const primaValida = nuove.find((n) => n.fattura);
    if (primaValida) setSel({ tipo: 'nuova', id: primaValida.id });
  };

  const toggleLogo = () => {
    const v = !conLogo;
    setLogoDefault(v);
    if (nuovaSel) {
      setItems((prev) => prev.map((i) => (i.id === nuovaSel.id ? { ...i, conLogo: v } : i)));
    } else if (salvataSel) {
      setArchivio((prev) => prev.map((r) => (r.id === salvataSel.id ? { ...r, con_logo: v } : r)));
      fetch(`/api/fatture/${salvataSel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ con_logo: v }),
      });
    }
  };

  const scaricaBlob = async (key: string, req: Promise<Response>, filename: string) => {
    setBusy(key);
    setErrore('');
    try {
      const res = await req;
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
        throw new Error(error);
      }
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErrore((e as Error).message);
    }
    setBusy(null);
  };

  const scaricaNuova = (item: Caricata) =>
    item.fattura &&
    scaricaBlob(
      item.id,
      fetch(`/api/fatture/pdf${item.conLogo ? '' : '?logo=0'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: item.xml,
      }),
      nomeFilePdf(item.fattura)
    );

  const scaricaSalvata = (r: FatturaSalvata) => {
    let nome = `fattura-${r.numero}-${r.anno}.pdf`;
    try { nome = nomeFilePdf(parseFattura(r.xml)); } catch {}
    scaricaBlob(`s${r.id}`, fetch(`/api/fatture/${r.id}/pdf`), nome);
  };

  const salva = async (item: Caricata): Promise<boolean> => {
    setBusy(item.id);
    setErrore('');
    try {
      const res = await fetch('/api/fatture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml: item.xml, con_logo: item.conLogo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Salvataggio non riuscito');
      const row = data as FatturaSalvata;
      setArchivio((prev) =>
        [row, ...prev.filter((r) => r.id !== row.id)].sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
      );
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setSel((s) => (s?.tipo === 'nuova' && s.id === item.id ? { tipo: 'salvata', id: row.id } : s));
      return true;
    } catch (e) {
      setErrore((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const salvaTutte = async () => {
    for (const item of items.filter((i) => i.fattura)) {
      if (!(await salva(item))) break;
    }
  };

  const cambiaStato = (r: FatturaSalvata) => {
    const stato = r.stato === 'pagata' ? 'da_pagare' : 'pagata';
    setArchivio((prev) => prev.map((x) => (x.id === r.id ? { ...x, stato } : x)));
    fetch(`/api/fatture/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stato }),
    });
  };

  const eliminaSalvata = async (r: FatturaSalvata) => {
    if (!confirm(`Eliminare dall'archivio la fattura n. ${r.numero} di ${r.cliente_nome}?`)) return;
    const res = await fetch(`/api/fatture/${r.id}`, { method: 'DELETE' });
    if (!res.ok) return setErrore('Eliminazione non riuscita');
    setArchivio((prev) => prev.filter((x) => x.id !== r.id));
    if (sel?.tipo === 'salvata' && sel.id === r.id) setSel(null);
  };

  const rimuoviNuova = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (sel?.tipo === 'nuova' && sel.id === id) setSel(null);
  };

  const daSalvare = items.filter((i) => i.fattura).length;

  return (
    <div className="min-h-screen text-text">

      <header className="border-b border-edge px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Fatture</h1>
          <p className="text-dim text-sm mt-0.5">Carica l’XML dell’Agenzia delle Entrate, salvalo in archivio e scarica la copia di cortesia brandizzata.</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer select-none shrink-0">
          <span className="text-sm text-muted">Logo nel PDF</span>
          <button
            type="button"
            role="switch"
            aria-checked={conLogo}
            onClick={toggleLogo}
            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer ${conLogo ? 'bg-accent' : 'bg-edge'}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${conLogo ? 'translate-x-4' : ''}`}
            />
          </button>
        </label>
      </header>

      <div className="px-6 py-6 max-w-7xl mx-auto flex flex-col gap-8">

        {archivio.length > 0 && <FattureAnalisi archivio={archivio} />}

        <div className="grid gap-6 lg:grid-cols-[380px_1fr] items-start">

          {/* ── Colonna sinistra: upload, da salvare, archivio ── */}
          <div className="flex flex-col gap-5">
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
              className={`w-full border-2 border-dashed rounded-xl px-5 py-7 text-center transition-colors cursor-pointer ${
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

            {errore && <p className="text-red-400 text-xs font-mono">⚠ {errore}</p>}

            {/* Da salvare */}
            {items.length > 0 && (
              <section className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-dim text-xs font-medium">DA SALVARE ({items.length})</p>
                  {daSalvare > 1 && (
                    <button onClick={salvaTutte} disabled={busy !== null} className="text-xs text-accent hover:underline disabled:opacity-50 cursor-pointer">
                      Salva tutte
                    </button>
                  )}
                </div>
                {items.map((item) => {
                  const f = item.fattura;
                  const active = sel?.tipo === 'nuova' && sel.id === item.id;
                  if (!f) {
                    return (
                      <div key={item.id} className="bg-surface border border-edge rounded-xl px-4 py-3.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-text text-sm truncate">{item.fileName}</p>
                          <p className="text-red-400 text-xs mt-1">{item.errore}</p>
                        </div>
                        <button onClick={() => rimuoviNuova(item.id)} className={btnIcon}>×</button>
                      </div>
                    );
                  }
                  const esistente = inArchivio(f);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSel({ tipo: 'nuova', id: item.id })}
                      className={`bg-surface border rounded-xl px-4 py-3.5 cursor-pointer hover:bg-surface2/50 transition-colors ${active ? 'border-accent' : 'border-edge border-dashed'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-dim text-xs">
                            {TIPO_DOCUMENTO[f.tipoDocumento] ?? 'Fattura'} n. {f.numero} · {dataLunga(f.data)}
                          </p>
                          <p className="text-text font-semibold text-sm truncate mt-0.5">{f.committente.nome}</p>
                          <p className="text-sm font-bold mt-1">{eur(f.totaleDocumento)}</p>
                          {esistente && <p className="text-amber-400 text-xs mt-1">Già in archivio: salvando la aggiorni</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); scaricaNuova(item); }}
                            disabled={busy === item.id}
                            title="Scarica PDF senza salvare"
                            className={btnIcon}
                          >
                            <IconDownload />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); salva(item); }}
                            disabled={busy === item.id}
                            className={btnAccent}
                          >
                            {busy === item.id ? '...' : esistente ? 'Aggiorna' : 'Salva'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); rimuoviNuova(item.id); }} title="Rimuovi" className={btnIcon}>×</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {/* Archivio */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-dim text-xs font-medium shrink-0">ARCHIVIO ({archivio.length})</p>
                {archivio.length > 5 && (
                  <input
                    type="search"
                    value={cerca}
                    onChange={(e) => setCerca(e.target.value)}
                    placeholder="Cerca cliente, numero…"
                    className="w-full max-w-48 bg-bg border border-edge rounded-lg px-2.5 py-1 text-xs text-text placeholder-dim focus:outline-none focus:border-slate"
                  />
                )}
              </div>
              {archivio.length === 0 ? (
                <p className="text-dim text-sm">Nessuna fattura salvata. Caricane una e premi “Salva”.</p>
              ) : (
                <div className="bg-surface border border-edge rounded-xl overflow-hidden max-h-[560px] overflow-y-auto">
                  {archivioFiltrato.map((r, i) => {
                    const active = sel?.tipo === 'salvata' && sel.id === r.id;
                    const pagata = r.stato === 'pagata';
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSel({ tipo: 'salvata', id: r.id })}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${i ? 'border-t border-edge/60' : ''} ${
                          active ? 'bg-surface2' : 'hover:bg-surface2/50'
                        }`}
                      >
                        <div className={`w-[3px] self-stretch rounded-sm shrink-0 ${active ? 'bg-accent' : 'bg-transparent'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-dim text-xs">n. {r.numero} · {r.data.split('-').reverse().join('/')}</p>
                          <p className="text-text text-sm font-medium truncate">{r.cliente_nome}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{eur(r.importo)}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); cambiaStato(r); }}
                            title="Cambia stato pagamento"
                            className={`text-xs mt-0.5 inline-flex items-center gap-1.5 cursor-pointer ${pagata ? 'text-green-400' : 'text-amber-400'}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${pagata ? 'bg-green-400' : 'bg-amber-400'}`} />
                            {pagata ? 'Pagata' : 'Da pagare'}
                          </button>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); scaricaSalvata(r); }}
                            disabled={busy === `s${r.id}`}
                            title="Scarica PDF"
                            className={btnGhost}
                          >
                            {busy === `s${r.id}` ? '...' : <IconDownload />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); eliminaSalvata(r); }} title="Elimina" className={btnIcon}>×</button>
                        </div>
                      </div>
                    );
                  })}
                  {archivioFiltrato.length === 0 && <p className="text-dim text-sm px-4 py-3">Nessun risultato.</p>}
                </div>
              )}
            </section>
          </div>

          {/* ── Colonna destra: anteprima ── */}
          <div className="min-w-0 lg:sticky lg:top-6">
            {fatturaSel ? (
              <Anteprima html={renderFatturaHtml(fatturaSel, { logo: conLogo })} />
            ) : (
              <div className="border border-edge rounded-xl bg-surface flex items-center justify-center text-dim text-sm aspect-[210/297] max-h-[70vh] mx-auto">
                L’anteprima della fattura apparirà qui
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
