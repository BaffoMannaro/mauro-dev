---
name: preventivo-mauro-altamura
description: >
  Genera il PDF del preventivo professionale di Mauro Altamura usando il template
  Python con ReportLab/reportlab. Usa questa skill ogni volta che l'utente vuole
  creare, generare o aggiornare un preventivo — anche se non usa la parola esatta
  "preventivo": frasi come "fai il PDF per il cliente X", "prepara l'offerta per
  Y", "crea il documento per il progetto Z", "genera il preventivo", "preventivo
  per [nome]" devono attivare questa skill. Produce un PDF branded pronto da
  inviare al cliente, con importi, voci, tranches e firma.
---

# Skill: Preventivo Mauro Altamura

Genera il PDF del preventivo professionale partendo dai dati forniti dall'utente.
Il template grafico è fisso (branded, ReportLab). Questa skill configura i dati
e fa girare lo script.

---

## Dipendenze

```bash
pip install reportlab --break-system-packages
```

Il font NotoSans deve essere disponibile in `/usr/share/fonts/truetype/noto/`.
Verifica con:
```bash
ls /usr/share/fonts/truetype/noto/NotoSans-Regular.ttf 2>/dev/null && echo "OK" || echo "MANCANTE"
```

Se mancante, copia un font sans-serif disponibile come proxy:
```bash
mkdir -p /usr/share/fonts/truetype/noto/
cp /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf /usr/share/fonts/truetype/noto/NotoSans-Regular.ttf
cp /usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf /usr/share/fonts/truetype/noto/NotoSans-Bold.ttf
```
DejaVuSans è sempre disponibile nell'ambiente e funziona come drop-in per il rendering del PDF.

---

## File della skill

| File | Ruolo |
|------|-------|
| `assets/template_preventivo.py` | Script ReportLab — parte grafica fissa |
| `assets/logo.png` | Logo Mauro Altamura per l'header |

---

## Workflow

### Passo 1 — Raccolta dati

Prima di tutto, estrai dall'utente (o dalla conversazione) le seguenti informazioni:

**Obbligatori:**
- `CLIENTE_NOME` — nome azienda o cliente
- `COMPENSO_TOTALE` — importo totale in formato `€ X.XXX,00`
- `VOCI` — le voci del preventivo (nome, descrizione opzionale, importo)

**Opzionali (usa i default se non specificati):**
- `CLIENTE_PIVA` — P.IVA cliente (default: `""` se privato)
- `DATA` — data emissione (default: data odierna in italiano, es. "9 Giugno 2026")
- `OGGETTO_TITOLO` — titolo oggetto (default: `"Sviluppo Sito Web"`)
- `OGGETTO_TESTO` — testo introduttivo (default: generato automaticamente)
- `SCHEMA_PAGAMENTO` — `"50/50"`, `"33/67"`, `"25/75"` (default: `"50/50"`)
- `MODALITA_PAGAMENTO` — (default: `"Bonifico bancario"`)
- `MODALITA_VOCI` — `"lista"` o `"fasi"` (default: `"lista"`)

**Sezioni opzionali (attiva solo se l'utente le menziona):**
- `TEMPI_CONSEGNA` — es. "entro 4 settimane dalla firma"
- `GARANZIA_TESTO` — testo garanzia post-lancio
- `COSA_NON_INCLUDE` — lista di esclusioni
- `MANUTENZIONE_ATTIVA` + `MANUTENZIONE_TESTO` + `MANUTENZIONE_PREZZO`
- `FASI_SUCCESSIVE_TESTO`

Se l'utente usa `MODALITA_VOCI = "fasi"`, raccogliere per ogni fase:
- `label` (es. "FASE 1"), `titolo`, `periodo`, `voci` (lista), `deliverable` (opzionale)

---

### Passo 2 — Costruzione dello script

Copia il template in `/home/claude/preventivo_run.py` e sostituisci **solo** la sezione di configurazione (righe 9–133) con i dati reali. La parte grafica (da riga 138 in poi) va lasciata intatta.

Il path del logo va impostato all'asset bundled:
```python
LOGO_PATH = "/home/claude/logo_preventivo.png"
```

Il path di output:
```python
OUTPUT = "/mnt/user-data/outputs/Preventivo_MauroAltamura.pdf"
```

**Formato importi:** usa sempre `€ X.XXX,00` (punto come separatore migliaia, virgola come decimale).

**Formato data:** scrivi la data in italiano per esteso, es. `"9 Giugno 2026"`.

---

### Passo 3 — Esecuzione

```bash
# 1. Copia logo — OBBLIGATORIO, senza questo il logo non appare nell'header
cp /home/claude/preventivo-skill/assets/logo.png /home/claude/logo_preventivo.png

# 2. Installa dipendenze se serve
pip install reportlab --break-system-packages -q

# 3. Esegui
python /home/claude/preventivo_run.py
```

Il template cerca il logo esattamente in `/home/claude/logo_preventivo.png`. Se mancante, l'header viene generato senza logo — nessun errore, ma il PDF è incompleto. Il passo 1 va sempre eseguito.

Se lo script stampa `✓ PDF generato:` → successo.
Se ci sono errori di font, prova:
```bash
find /usr/share/fonts -name "NotoSans-Regular.ttf" 2>/dev/null
```
e aggiorna `FONT_PATH` nello script con il path corretto.

---

### Passo 4 — Consegna

Usa `present_files` con il path `/mnt/user-data/outputs/Preventivo_MauroAltamura.pdf`.

Dopo la consegna, chiedi brevemente se vuole modificare qualcosa (importi, voci, schema pagamento). Non fare domande prolisse.

---

## Regole di generazione

- **Non inventare importi.** Se l'utente non li specifica, usa `€ 0.000,00` come placeholder e segnalalo.
- **Non modificare la grafica.** Tutta la sezione dal `# FINE CONFIGURAZIONE` in giù è intoccabile.
- **Usa il formato HEX esatto** per i colori se mai devi citarli: `#4C5760`, `#FF006E`, `#CBD2D0`.
- **Tono di output** verso l'utente: diretto, breve, senza fronzoli. Conferma cosa stai facendo in una riga.
- Se l'utente dà dati parziali, procedi con i default ragionevoli e segnala cosa hai assunto.

---

## Esempi di attivazione

| Richiesta utente | Attiva skill? |
|-----------------|---------------|
| "Genera il preventivo per Antonio Grosso, sito WordPress, 1.800€" | ✅ |
| "Fai il PDF per il progetto Ciccolella" | ✅ |
| "Prepara l'offerta per Cream, 3 fasi, totale 4.500€" | ✅ |
| "Aggiorna il preventivo con la voce manutenzione" | ✅ |
| "Crea il documento da inviare al cliente" | ✅ |
| "Scrivi un'email al cliente" | ❌ (usa skill email) |
| "Analizza questo sito" | ❌ |
