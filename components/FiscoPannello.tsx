'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { euro, euroCent } from '@/lib/formato';
import type { Fisco, ImpostazioniFisco } from '@/lib/fisco';

const dataLunga = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

const inputCls =
  'w-full bg-bg border border-edge rounded-lg px-3 py-2 text-sm text-text placeholder-dim focus:outline-none focus:border-slate tabular-nums';

/** Da accantonare, scadenze e dati fiscali dell'anno in corso (vedi lib/fisco.ts). */
export default function FiscoPannello({ fisco: f, impostazioni }: { fisco: Fisco; impostazioni: ImpostazioniFisco }) {
  const anno = f.anno;
  const [aperto, setAperto] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-dim text-xs font-medium">TASSE {anno} · FORFETTARIO</p>
        <button onClick={() => setAperto((v) => !v)} className="text-xs text-muted hover:text-text cursor-pointer">
          {aperto ? 'Chiudi dati fiscali' : 'Dati fiscali'}
        </button>
      </div>

      {f.datiMancanti && (
        <p className="text-amber-400 text-xs bg-amber-950/30 border border-amber-800/60 rounded-lg px-3 py-2">
          Mancano i dati della dichiarazione {anno - 1}: acconti e scadenze non sono ancora esatti. Inseriscili in “Dati fiscali”.
        </p>
      )}

      <div className="scheda flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="text-dim text-xs font-medium">DA ACCANTONARE</p>
            <p className="text-dim text-xs mt-0.5">tasse e contributi {anno} non ancora versati</p>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-accent tabular-nums">{euro(f.daAccantonare)}</p>
        </div>
        {f.scadenze.length > 0 && (
          <div className="flex flex-col">
            {f.scadenze.map((s) => (
              <div key={s.data} className="flex items-start justify-between gap-3 py-3 border-t border-edge/60 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{dataLunga(s.data)}</p>
                  <p className="text-dim text-xs">
                    {s.titolo}
                    {s.stimata && ' · stima'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold tabular-nums ${s.totale < 0 ? 'text-green-400' : ''}`}>
                    {s.totale < 0 ? `${euroCent(-s.totale)} a credito` : euroCent(s.totale)}
                  </p>
                  <p className="text-dim text-xs tabular-nums">imposta {euroCent(s.imposta)} · INPS {euroCent(s.contributi)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-dim text-xs">
          Scadenze al 30 giugno e al 30 novembre; il saldo si può spostare al 30 luglio con lo 0,40% in più (non incluso).
          Stima per accantonare: i numeri finali sono quelli della dichiarazione.
        </p>
      </div>

      {aperto && <DatiFiscali anno={anno} impostazioni={impostazioni} onChiudi={() => setAperto(false)} />}
    </section>
  );
}

function DatiFiscali({ anno, impostazioni, onChiudi }: { anno: number; impostazioni: ImpostazioniFisco; onChiudi: () => void }) {
  const router = useRouter();
  const prec = String(anno - 1);
  const d = impostazioni.anni[prec];
  const perc = (n: number) => String(Math.round(n * 10000) / 100);
  const [form, setForm] = useState({
    coefficiente: perc(impostazioni.coefficiente),
    aliquotaContributi: perc(impostazioni.aliquotaContributi),
    aliquotaImposta: perc(impostazioni.aliquotaImposta),
    imposta: d ? String(d.imposta) : '',
    accontiImposta: d ? String(d.accontiImposta) : '',
    contributi: d ? String(d.contributi) : '',
    accontiContributi: d ? String(d.accontiContributi) : '',
  });
  const [salvando, setSalvando] = useState(false);
  const [errore, setErrore] = useState('');
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  // Accetta "1.234,56", "1234,56", "1234.56" e "26,07".
  const num = (v: string) => {
    const t = v.trim().replace(/[€\s]/g, '');
    if (t.includes(',')) return Number(t.replace(/\./g, '').replace(',', '.'));
    return Number(/^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, '') : t);
  };

  const salva = async () => {
    setErrore('');
    const valori = Object.values(form).map((v) => (v.trim() === '' ? 0 : num(v)));
    if (valori.some((v) => !Number.isFinite(v) || v < 0)) return setErrore('Controlla i valori: solo numeri positivi');
    const anniCompilati = ['imposta', 'accontiImposta', 'contributi', 'accontiContributi'].some((k) => form[k as keyof typeof form].trim() !== '');
    const valore: ImpostazioniFisco = {
      ...impostazioni,
      coefficiente: num(form.coefficiente) / 100,
      aliquotaContributi: num(form.aliquotaContributi) / 100,
      aliquotaImposta: num(form.aliquotaImposta) / 100,
      anni: {
        ...impostazioni.anni,
        ...(anniCompilati
          ? {
              [prec]: {
                imposta: num(form.imposta || '0'),
                accontiImposta: num(form.accontiImposta || '0'),
                contributi: num(form.contributi || '0'),
                accontiContributi: num(form.accontiContributi || '0'),
              },
            }
          : {}),
      },
    };
    setSalvando(true);
    const res = await fetch('/api/impostazioni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chiave: 'fisco', valore }),
    });
    setSalvando(false);
    if (!res.ok) return setErrore('Salvataggio non riuscito');
    onChiudi();
    router.refresh();
  };

  const campo = (k: keyof typeof form, label: string, aiuto?: string) => (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-dim text-xs font-medium">{label}</span>
      <input inputMode="decimal" value={form[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
      {aiuto && <span className="text-dim text-[11px] leading-snug">{aiuto}</span>}
    </label>
  );

  return (
    <div className="scheda flex flex-col gap-4">
      <div>
        <p className="text-sm font-semibold">Parametri</p>
        <div className="grid grid-cols-3 gap-3 mt-3">
          {campo('coefficiente', 'COEFF. %', 'ATECO 62.10: 67')}
          {campo('aliquotaContributi', 'INPS %', 'Gest. separata: 26,07')}
          {campo('aliquotaImposta', 'IMPOSTA %', 'Oltre 5 anni: 15')}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">Dichiarazione {prec} (Modello Redditi {anno})</p>
        <p className="text-dim text-xs mt-0.5">Servono per acconti e saldo esatti. In euro.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {campo('imposta', `IMPOSTA SOSTITUTIVA ${prec}`, 'Quadro LM, imposta dovuta')}
          {campo('accontiImposta', `ACCONTI IMPOSTA VERSATI PER IL ${prec}`, 'Giugno + novembre ' + prec)}
          {campo('contributi', `CONTRIBUTI INPS ${prec}`, 'Quadro RR, contributo dovuto')}
          {campo('accontiContributi', `ACCONTI INPS VERSATI PER IL ${prec}`, 'Giugno + novembre ' + prec)}
        </div>
      </div>
      {errore && <p className="text-red-400 text-xs font-mono">⚠ {errore}</p>}
      <div className="flex gap-2">
        <button onClick={onChiudi} className="flex-1 sm:flex-none sm:px-5 py-2.5 text-sm bg-surface2 hover:bg-slate text-muted hover:text-text rounded-xl transition-colors cursor-pointer">Annulla</button>
        <button onClick={salva} disabled={salvando} className="flex-1 sm:flex-none sm:px-5 py-2.5 text-sm bg-accent text-on-accent font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40 cursor-pointer">
          {salvando ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </div>
  );
}
