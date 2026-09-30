'use client';

import { useCallback, useEffect, useRef } from 'react';

// Registra l'apertura della pagina pubblica del preventivo e cosa fa il cliente:
// sezioni aperte, PDF scaricato e tempo passato con la pagina visibile.
// Nessun cookie né identificativo persistente: un id casuale per ogni caricamento.
export function useTracciaVisita(token: string) {
  const visitaId = useRef<string | null>(null);

  const invia = useCallback(
    (dati: Record<string, unknown>, beacon = false) => {
      if (!visitaId.current) return;
      const body = JSON.stringify({ ...dati, visita_id: visitaId.current });
      const url = `/api/p/${token}/visita`;
      if (beacon && navigator.sendBeacon) navigator.sendBeacon(url, body);
      else fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
    },
    [token]
  );

  useEffect(() => {
    // Browser automatici (generazione PDF) e anteprime di stampa non contano.
    const q = new URLSearchParams(window.location.search);
    if (navigator.webdriver || q.has('pdf')) return;

    visitaId.current = crypto.randomUUID();
    invia({ evento: 'inizio', referrer: document.referrer });

    let attivo = 0;
    let da = document.visibilityState === 'visible' ? performance.now() : null;
    const chiudi = () => {
      if (da !== null) {
        attivo += performance.now() - da;
        da = null;
      }
      invia({ evento: 'fine', durata_ms: attivo }, true);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') chiudi();
      else da = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', chiudi);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', chiudi);
    };
  }, [invia]);

  return {
    sezione: (titolo: string) => invia({ evento: 'sezione', sezione: titolo }),
    pdf: () => invia({ evento: 'pdf' }),
  };
}
