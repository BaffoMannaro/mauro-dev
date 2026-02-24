# Blog App

Questa app Django gestisce un sistema di blog con articoli, tag e blocchi di contenuto.

## Modelli

### Tag

- `id`: ID univoco (auto-generato)
- `name`: Nome interno del tag (univoco, minuscole, senza spazi)
- `display_name`: Nome visualizzato del tag

### Article

- `id`: ID univoco (auto-generato)
- `title`: Titolo dell'articolo (univoco)
- `slug`: URL-friendly slug (univoco, auto-generato dal title)
- `meta_title`: Meta title per SEO
- `meta_description`: Meta description per SEO
- `main_image`: Immagine principale dell'articolo
- `main_tag`: Tag principale (ForeignKey a Tag)
- `other_tags`: Altri tag associati (ManyToMany con Tag)
- `created_at`: Data di creazione (auto-generata)
- `updated_at`: Data ultima modifica (auto-aggiornata)
- `is_published`: Flag di pubblicazione
- `published_at`: Data di pubblicazione

### Block

- `id`: ID univoco (auto-generato)
- `article`: Articolo di appartenenza (ForeignKey a Article)
- `block_type`: Tipo di blocco ('text' per HTML o 'image' per immagini)
- `content`: Contenuto HTML (per blocchi di testo) o path immagine
- `image`: File immagine (per blocchi immagine)
- `order`: Ordine del blocco nell'articolo

I blocchi permettono di creare articoli flessibili con sequenze variabili di testo e immagini (es: testo-testo-immagine, immagine-testo-testo, ecc.)

## API Endpoints

L'app espone i seguenti endpoint REST:

### Tags

- `GET /blog/tags/` - Lista tutti i tag
- `POST /blog/tags/` - Crea un nuovo tag (richiede autenticazione)
- `GET /blog/tags/{id}/` - Dettaglio di un tag
- `PUT/PATCH /blog/tags/{id}/` - Aggiorna un tag (richiede autenticazione)
- `DELETE /blog/tags/{id}/` - Elimina un tag (richiede autenticazione)

### Articles

- `GET /blog/articles/` - Lista tutti gli articoli
- `GET /blog/articles/published/` - Lista solo gli articoli pubblicati
- `GET /blog/articles/{slug}/` - Dettaglio di un articolo tramite slug
- `POST /blog/articles/` - Crea un nuovo articolo (richiede autenticazione)
- `PUT/PATCH /blog/articles/{slug}/` - Aggiorna un articolo (richiede autenticazione)
- `DELETE /blog/articles/{slug}/` - Elimina un articolo (richiede autenticazione)

### Blocks

- `GET /blog/blocks/` - Lista tutti i blocchi
- `POST /blog/blocks/` - Crea un nuovo blocco (richiede autenticazione)
- `GET /blog/blocks/{id}/` - Dettaglio di un blocco
- `PUT/PATCH /blog/blocks/{id}/` - Aggiorna un blocco (richiede autenticazione)
- `DELETE /blog/blocks/{id}/` - Elimina un blocco (richiede autenticazione)

## Filtri e Ricerca

### Articles

- Filtri: `is_published`, `main_tag`, `other_tags`
- Ricerca: `title`, `slug`, `meta_title`, `meta_description`
- Ordinamento: `created_at`, `published_at`, `title`

### Tags

- Ricerca: `name`, `display_name`
- Ordinamento: `name`, `display_name`

### Blocks

- Filtri: `article`, `block_type`
- Ordinamento: `order`

## Admin

L'app è completamente gestibile dall'admin di Django:

- **Tag Admin**: Lista e modifica dei tag
- **Article Admin**: Gestione completa degli articoli con inline editor per i blocchi, filtri, ricerca e prepopolamento dello slug
- **Block Admin**: Gestione diretta dei blocchi (opzionale, solitamente gestiti tramite Article inline)

## Installazione e Setup

1. Installa le nuove dipendenze:

```bash
pip install -r requirements.txt
```

2. Crea le migrazioni:

```bash
python manage.py makemigrations blog
```

3. Applica le migrazioni:

```bash
python manage.py migrate
```

4. Crea un superuser se non ne hai già uno:

```bash
python manage.py createsuperuser
```

5. Accedi all'admin Django e inizia a creare tag e articoli!

## Note

- Gli articoli non pubblicati (`is_published=False`) sono visibili solo agli utenti autenticati
- Gli endpoint di lettura sono pubblici, mentre quelli di scrittura richiedono autenticazione
- Lo slug viene generato automaticamente dal titolo se non specificato
- Il meta_title viene impostato automaticamente uguale al title se non specificato
- I blocchi sono ordinati per il campo `order` e devono avere un ordine univoco per articolo
