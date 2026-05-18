# SEO / Indicizzazione Google — Valutazioni e Fix (superotech.ai)

## 1) Il dominio `www` serve comunque le pagine (quindi Google può scansionarle)

**Da dove viene il dato:** controlli HTTP (status code).

- Aprendo `https://www.superotech.ai/supero-finish` si arriva a una pagina che risponde **200 OK** (dopo il redirect per aggiungere lo slash finale).
- Quindi `www.superotech.ai` non è solo un redirect: sta effettivamente servendo contenuti.

## 2) Ma quelle stesse pagine su `www` dichiarano come “ufficiale” il dominio senza `www`

**Da dove viene il dato:** analisi dell’HTML restituito dalla pagina.

Nell’HTML di `https://www.superotech.ai/supero-finish/` sono presenti tag SEO che indicano come URL canonico (cioè la versione “da indicizzare”) quello **senza** **`www`**:

- `rel="canonical"` → `https://superotech.ai/supero-finish/`
- `og:url` → `https://superotech.ai/supero-finish/`

## Perché questo crea problemi a Google

In pratica succede questo:

- esiste una versione su `www` (raggiungibile e scansionabile)
- esiste una versione su `non‑www` (raggiungibile e scansionabile)
- però la versione `www` dice a Google “la vera è non‑www”

Se non c’è anche un **redirect 301** da `www` a `non‑www`, Google può:

- vedere due copie dello stesso contenuto,
- dividere i segnali tra i due host,
- fare più fatica a capire struttura e pagine principali da indicizzare.

La correzione più efficace è scegliere un solo dominio canonico (in questo caso `superotech.ai`) e fare un redirect **301 globale**:

`https://www.superotech.ai/*` → `https://superotech.ai/*`

## Nota sulla pipeline (solo per stabilizzare)

La pipeline non è “necessaria” per risolvere questo punto del redirect, ma serve a evitare regressioni:

- garantire che sitemap e prerender (se usati) vengano generati sempre con il dominio corretto,
- evitare di pubblicare per errore una build con canonical/sitemap non coerenti.

