---
name: preventivo-json-maurodev
description: >
  Genera il JSON di un preventivo pronto per essere importato nel gestionale di
  maurodev.it (box "Nuovo preventivo" → "Incolla qui il JSON"). Usa questa skill
  ogni volta che l'utente vuole creare, preparare o aggiornare un preventivo da
  caricare sul sito — anche senza la parola esatta "preventivo": frasi come
  "fammi il JSON per il cliente X", "prepara il preventivo per Y da importare",
  "genera il preventivo per il progetto Z", "offerta per [nome] da caricare sul
  sito" devono attivare questa skill. L'output è ESCLUSIVAMENTE un blocco JSON
  valido, conforme allo schema d'importazione, che l'utente copia e incolla nel
  gestionale. NON genera PDF (per il PDF esiste la skill "preventivo-mauro-altamura").
---

# Skill: Preventivo JSON per maurodev.it

Produce il **JSON di importazione** di un preventivo, conforme esatto allo schema
letto dal box **"Nuovo preventivo"** del gestionale (`components/NuovoPreventivo.tsx`).
L'utente incolla il JSON nella textarea, clicca "Anteprima" e poi "Carica preventivo".

Il deliverable di questa skill è **un solo blocco ```json``` valido**, nient'altro
(a parte una riga di conferma sintetica). Niente PDF, niente testo attorno al JSON.

---

## Schema di importazione (autorità: il codice del sito)

```jsonc
{
  "cliente": {
    "nome": "string",          // OBBLIGATORIO — nome cliente O ragione sociale (vedi nota 1)
    "email": "string",         // OBBLIGATORIO — email valida
    "piva": "string",          // opzionale — P.IVA/C.F., mostrata come "P.IVA ..."
    "telefono": "string"       // opzionale — mostrato sotto l'email
  },
  "preventivo": {
    "oggetto": "string",              // OBBLIGATORIO — titolo del lavoro
    "scadenza": "YYYY-MM-DD",         // opzionale ma consigliata — data ISO
    "iva": false,                     // opzionale — false = esente/forfettario (DEFAULT), true = IVA 22%
    "modalita_pagamento": "Bonifico bancario", // opzionale — mostrato (default "Bonifico bancario")
    "data": "9 Giugno 2026",          // opzionale — NON mostrato dal sito (vedi nota 3). Includere solo se richiesto
    "schema_pagamento": "50/50"       // opzionale — NON mostrato dal sito (vedi nota 3). Le tranches guidano il pagamento
  },
  "sezioni": {
    "intro": "string",                // opzionale — paragrafo introduttivo
    "descrizione": "string",          // opzionale — descrizione estesa (supporta \n)
    "voci": {                         // OBBLIGATORIO
      "modalita": "lista",            // sempre "lista" (vedi nota 4)
      "items": [                      // OBBLIGATORIO — almeno 1 elemento
        { "descrizione": "string", "quantita": 1, "prezzo": 1500 }
      ]
    },
    "tranches": [                     // opzionale — rate di pagamento; le percentuali dovrebbero sommare a 100
      { "descrizione": "Acconto alla firma (50%)", "percentuale": 50 },
      { "descrizione": "Saldo alla consegna (50%)", "percentuale": 50 }
    ],
    "tempi": "string",                // opzionale
    "garanzia": "string",             // opzionale
    "esclusioni": ["string"],         // opzionale — lista "Non incluso"
    "manutenzione": {                 // opzionale — mostrato come "€X/mese"
      "descrizione": "string",
      "prezzo": 120
    },
    "fasi_successive": "string",      // opzionale — "Sviluppi futuri"
    "note": "string"                  // opzionale — note finali
  }
}
```

### Campi obbligatori (la validazione del sito rifiuta il JSON se mancano)
`cliente.nome`, `cliente.email`, `preventivo.oggetto`, `sezioni.voci.items` (≥ 1 voce).

---

## Regole di generazione (IMPORTANTE — derivano dal comportamento reale del sito)

1. **Nome vs azienda.** Il sito NON distingue persona e azienda: `cliente.azienda`
   viene sempre posto uguale a `cliente.nome`. Metti in `cliente.nome` ciò che deve
   comparire in grande sull'intestazione (ragione sociale se azienda, altrimenti nome
   e cognome). Non esiste un campo azienda separato utile.

2. **Tutto il testo narrativo va dentro `sezioni`.** La pagina cliente legge intro,
   descrizione, tempi, garanzia, esclusioni, manutenzione, fasi_successive e note
   **da `sezioni`** (salvate in `meta`). Non usare un campo `note` di primo livello:
   non verrebbe mostrato.

3. **Campi non mostrati dal sito:** `preventivo.data` e `preventivo.schema_pagamento`
   sono accettati ma NON compaiono nella pagina cliente (la data emissione è quella di
   caricamento; il piano pagamenti è guidato solo da `tranches`). Includili solo se
   l'utente lo chiede espressamente; altrimenti ometterli.

4. **Voci sempre in modalità "lista".** Il sito renderizza `sezioni.voci.items` come
   lista piatta. La modalità "fasi" (usata dalla skill PDF) NON è supportata qui:
   se il lavoro è a fasi, appiattiscilo in voci singole con descrizioni chiare.

5. **Importi netti.** I `prezzo` in `voci.items` sono l'**imponibile** (senza IVA).
   Il totale è calcolato dal sito come somma di `quantita × prezzo`. L'IVA (22%) viene
   aggiunta solo in visualizzazione quando `iva` è `true`.

6. **IVA di default = `false`** (regime forfettario/esente). Imposta `true` solo se
   l'utente indica esplicitamente che applica l'IVA.

7. **Date in ISO** per `scadenza`: `YYYY-MM-DD` (es. `2026-07-31`). Se l'utente dà una
   data in linguaggio naturale, convertila.

8. **Non inventare importi.** Se un prezzo non è fornito, chiedilo (una domanda secca)
   oppure usa `0` e segnalalo esplicitamente nella riga di conferma.

9. **Coerenza tranches.** Se presenti, le `percentuale` sommano a 100. Adatta le
   descrizioni allo schema reale (es. 50/50, 33/33/34, 30/70).

10. **Output = solo JSON valido.** Nessun commento dentro il JSON finale (i `//` qui
    sopra sono solo documentazione). Verifica mentalmente che sia parsabile con
    `JSON.parse` prima di consegnarlo.

---

## Workflow

1. **Raccogli i dati** dalla richiesta dell'utente: cliente (nome, email, eventuale
   P.IVA/telefono), oggetto, voci con prezzi, scadenza, regime IVA, ed eventuali
   sezioni opzionali (intro, tempi, garanzia, esclusioni, manutenzione, tranches…).
2. **Colma i buchi** con i default delle regole sopra; per ciò che manca ed è
   essenziale (prezzi, email) fai UNA domanda breve, altrimenti procedi.
3. **Costruisci il JSON** rispettando lo schema e le 10 regole.
4. **Consegna** un unico blocco ```json``` + una riga sola di conferma con eventuali
   assunzioni (es. "IVA esente assunta; scadenza a 30gg").
5. Se l'utente chiede modifiche, rigenera l'intero blocco JSON aggiornato.

---

## Esempio di output completo

```json
{
  "cliente": {
    "nome": "Rossi Srl",
    "email": "mario@rossisrl.it",
    "piva": "01234567890",
    "telefono": "339 1234567"
  },
  "preventivo": {
    "oggetto": "Sviluppo Sito Web Aziendale",
    "scadenza": "2026-07-31",
    "iva": false,
    "modalita_pagamento": "Bonifico bancario"
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
}
```

Con questo JSON il totale imponibile mostrato sarà €3.600 (esente IVA), con due rate
da €1.800.

---

## Esempi di attivazione

| Richiesta utente | Attiva skill? |
|-----------------|---------------|
| "Fammi il JSON del preventivo per Rossi Srl da caricare sul sito" | ✅ |
| "Prepara il preventivo per Antonio Grosso, sito WordPress 1.800€, da importare" | ✅ |
| "Genera l'offerta per Cream: design 1500, frontend 3200, esente IVA" | ✅ |
| "Aggiungi la voce manutenzione al JSON di prima" | ✅ |
| "Genera il PDF del preventivo" | ❌ (usa skill `preventivo-mauro-altamura`) |
| "Scrivi un'email al cliente" | ❌ |
