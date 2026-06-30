"""
╔══════════════════════════════════════════════════════════════════╗
║         TEMPLATE PREVENTIVO — MAURO ALTAMURA                    ║
║         Istruzioni: modifica solo la sezione CONFIGURAZIONE      ║
║         La parte grafica è fissa e non va toccata               ║
╚══════════════════════════════════════════════════════════════════╝
"""

# ════════════════════════════════════════════════════════════════════
#  CONFIGURAZIONE — MODIFICA SOLO QUESTA SEZIONE
# ════════════════════════════════════════════════════════════════════

# ── DATI CLIENTE ────────────────────────────────────────────────────
CLIENTE_NOME      = "Nome Azienda / Cliente"
CLIENTE_PIVA      = "IT00000000000"          # Lascia "" se privato
# CLIENTE_INDIRIZZO = "Via Roma 1, 00100 Roma"  # Decommenta se serve

# ── DATA ────────────────────────────────────────────────────────────
DATA = "24 Maggio 2026"

# ── OGGETTO ─────────────────────────────────────────────────────────
OGGETTO_TITOLO = "Sviluppo Sito Web"   # Es: "Sviluppo E-commerce", "Consulenza Digital"
OGGETTO_TESTO  = (
    "Il presente preventivo descrive le attività concordate per lo sviluppo "
    "e la realizzazione di [descrizione breve del progetto] per conto di "
    f"{CLIENTE_NOME}."
)

# ── COMPENSO TOTALE ─────────────────────────────────────────────────
COMPENSO_TOTALE = "€ 0.000,00"

# ── SCHEMA PAGAMENTO ────────────────────────────────────────────────
# Scegli uno schema: "33/67", "50/50", "25/75"
SCHEMA_PAGAMENTO = "50/50"

# ── MODALITÀ PAGAMENTO ──────────────────────────────────────────────
MODALITA_PAGAMENTO = "Bonifico bancario"

# ════════════════════════════════════════════════════════════════════
#  STRUTTURA DEL PREVENTIVO
#  Scegli una modalità: "fasi" oppure "lista"
# ════════════════════════════════════════════════════════════════════
MODALITA_VOCI = "lista"   # "fasi" | "lista"


# ── MODALITÀ LISTA ──────────────────────────────────────────────────
# Usata per preventivi semplici: siti web, e-commerce, servizi singoli
# Ogni voce: ("Nome servizio", "Descrizione", "€ X.XXX,00")
# Lascia la descrizione "" se non serve
VOCI_LISTA = [
    ("Sviluppo sito web",          "Design, sviluppo e configurazione completa",   "€ 0.000,00"),
    ("Setup CMS",                  "Configurazione WordPress/Shopify/altro",        "€ 0.000,00"),
    ("Ottimizzazione SEO on-page", "",                                              "€ 0.000,00"),
]


# ── MODALITÀ FASI ───────────────────────────────────────────────────
# Usata per progetti strutturati e consulenze
# Ogni fase: {
#   "label":       "FASE 0",
#   "titolo":      "Titolo della fase",
#   "periodo":     "Giugno — Luglio 2026",
#   "voci":        ["Voce 1", "Voce 2", ...],
#   "deliverable": "Descrizione del deliverable finale"  # "" per omettere
# }
VOCI_FASI = [
    {
        "label":       "FASE 1",
        "titolo":      "Analisi e Design",
        "periodo":     "Giugno 2026",
        "voci": [
            "Brief e raccolta requisiti",
            "Moodboard e definizione visual",
            "Prototipo wireframe",
        ],
        "deliverable": "Wireframe approvato e brief tecnico definitivo"
    },
    {
        "label":       "FASE 2",
        "titolo":      "Sviluppo",
        "periodo":     "Luglio — Agosto 2026",
        "voci": [
            "Sviluppo frontend e backend",
            "Integrazione CMS",
            "Test e ottimizzazione",
        ],
        "deliverable": "Sito web funzionante e testato, pronto per il go-live"
    },
]


# ════════════════════════════════════════════════════════════════════
#  SEZIONI OPZIONALI — Decommenta quelle che ti servono
# ════════════════════════════════════════════════════════════════════

# ── TEMPI DI CONSEGNA ───────────────────────────────────────────────
# Decommenta per attivare
# TEMPI_CONSEGNA = "Il progetto sarà completato entro [X settimane] dalla firma e dal ricevimento della prima tranche."

# ── GARANZIA POST-LANCIO ────────────────────────────────────────────
# Decommenta per attivare
# GARANZIA_TESTO = (
#     "Sono inclusi 30 giorni di supporto post-lancio per correzione di eventuali bug "
#     "e piccole modifiche non strutturali. Non include nuove funzionalità o revisioni "
#     "di design non concordate in fase di brief."
# )

# ── PIANO DI MANUTENZIONE ───────────────────────────────────────────
# Decommenta per attivare
# MANUTENZIONE_ATTIVA = True
# MANUTENZIONE_TESTO  = (
#     "Al termine del progetto è disponibile un Piano di Manutenzione mensile che include: "
#     "aggiornamenti CMS e plugin, monitoraggio uptime, backup settimanali, "
#     "supporto tecnico via email con risposta entro 48h lavorative e "
#     "fino a 2 ore di piccole modifiche mensili."
# )
# MANUTENZIONE_PREZZO = "€ 000,00 / mese"

# ── COSA NON INCLUDE ────────────────────────────────────────────────
# Decommenta per attivare
# COSA_NON_INCLUDE = [
#     "Acquisto domini e hosting (a carico del cliente)",
#     "Contenuti testuali e fotografici",
#     "Traduzioni in lingue straniere",
# ]

# ── FASI SUCCESSIVE ─────────────────────────────────────────────────
# Decommenta per attivare
# FASI_SUCCESSIVE_TESTO = (
#     "Al termine di questo incarico, le parti potranno concordare attività aggiuntive "
#     "con termini e compensi da definire separatamente."
# )


# ════════════════════════════════════════════════════════════════════
#  FINE CONFIGURAZIONE — NON MODIFICARE OLTRE QUESTA RIGA
# ════════════════════════════════════════════════════════════════════

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame, Flowable
import os, sys

# ── OUTPUT ──────────────────────────────────────────────────────────
OUTPUT = "/mnt/user-data/outputs/Preventivo_MauroAltamura.pdf"

# ── BRAND COLORS ────────────────────────────────────────────────────
IRON_GRAY  = HexColor("#4C5760")
NEON_PINK  = HexColor("#FF006E")
DUST_GRAY  = HexColor("#CBD2D0")
WHITE      = HexColor("#FAFAFA")
BLACK      = HexColor("#1A1A1A")
LIGHT_BG   = HexColor("#F2F3F4")
PINK_LIGHT = HexColor("#FFF0F5")

# ── FONTS ───────────────────────────────────────────────────────────
FONT_PATH = "/usr/share/fonts/truetype/noto/"
pdfmetrics.registerFont(TTFont("NotoSans",      FONT_PATH + "NotoSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("NotoSans-Bold", FONT_PATH + "NotoSans-Bold.ttf"))

W, H       = A4
MARGIN_L   = 18*mm
MARGIN_R   = 18*mm
MARGIN_B   = 18*mm
CONTENT_W  = W - MARGIN_L - MARGIN_R
HEADER_H   = 38*mm
LOGO_PATH  = "/home/claude/logo_preventivo.png"

# ── PIVA FISSA ──────────────────────────────────────────────────────
MAURO_PIVA = "IT08250840728"

# ── CALCOLO TRANCHES ────────────────────────────────────────────────
def calcola_tranches(totale_str, schema):
    try:
        val = float(totale_str.replace("€","").replace(".","").replace(",",".").strip())
    except:
        return [("1ª tranche","All'avvio","—"),("2ª tranche","Alla consegna","—")]
    schemi = {"33/67":(0.33,0.67),"50/50":(0.50,0.50),"25/75":(0.25,0.75)}
    p1, p2 = schemi.get(schema, (0.50, 0.50))
    v1 = round(val * p1, 2)
    v2 = round(val * p2, 2)
    pct1 = int(p1 * 100)
    pct2 = int(p2 * 100)
    fmt = lambda v: f"€ {v:,.2f}".replace(",","X").replace(".",",").replace("X",".")
    return [
        ("1ª tranche", "Alla firma dell'accordo e avvio dell'incarico",           f"{fmt(v1)}  ({pct1}%)"),
        ("2ª tranche", "Alla consegna del progetto completato e approvato",        f"{fmt(v2)}  ({pct2}%)"),
    ]

# ── STYLES ──────────────────────────────────────────────────────────
def S(name, font="NotoSans", size=10, color=BLACK, align=TA_LEFT,
      spaceBefore=0, spaceAfter=4, bold=False):
    return ParagraphStyle(name,
        fontName="NotoSans-Bold" if bold else font,
        fontSize=size, textColor=color, alignment=align,
        leading=size*1.45, spaceBefore=spaceBefore, spaceAfter=spaceAfter)

S_BODY      = S("body",    size=9.5, color=IRON_GRAY, spaceAfter=6)
S_BODY_B    = S("bodyb",   size=9.5, color=IRON_GRAY, bold=True, spaceAfter=6)
S_SMALL     = S("small",   size=8,   color=IRON_GRAY)
S_WHITE_B   = S("whiteb",  size=10,  color=WHITE, bold=True)
S_DUST      = S("dust",    size=8,   color=DUST_GRAY)

def bullet(text):
    return Paragraph(
        f"<font color='#FF006E'>—</font>  {text}",
        S("blt", size=9.5, color=IRON_GRAY, spaceBefore=2, spaceAfter=2))

# ── SECTION TITLE ───────────────────────────────────────────────────
class SectionTitle(Flowable):
    def __init__(self, text, width):
        Flowable.__init__(self)
        self.text  = text
        self._width  = width
        self._height = 10*mm
    def draw(self):
        c = self.canv
        c.setFillColor(NEON_PINK)
        c.rect(0, 0, 2.5*mm, self._height - 2*mm, fill=1, stroke=0)
        c.setFont("NotoSans-Bold", 11)
        c.setFillColor(IRON_GRAY)
        c.drawString(5*mm, 2*mm, self.text)
    def wrap(self, aw, ah):
        return self._width, self._height

# ── HEADER / FOOTER ─────────────────────────────────────────────────
def draw_header(c, doc):
    c.setFillColor(IRON_GRAY)
    c.rect(0, H - HEADER_H, W, HEADER_H, fill=1, stroke=0)
    c.setFillColor(NEON_PINK)
    c.rect(0, H - HEADER_H, W, 1.2*mm, fill=1, stroke=0)
    logo_size = 22*mm
    logo_x    = MARGIN_L
    logo_y    = H - HEADER_H + (HEADER_H - 1.2*mm - logo_size) / 2
    try:
        c.drawImage(LOGO_PATH, logo_x, logo_y,
                    width=logo_size, height=logo_size,
                    preserveAspectRatio=True, mask='auto')
    except:
        pass
    tx = logo_x + logo_size + 5*mm
    c.setFillColor(WHITE)
    c.setFont("NotoSans-Bold", 16)
    c.drawString(tx, H - 14*mm, "Mauro Altamura")
    c.setFont("NotoSans", 9)
    c.setFillColor(DUST_GRAY)
    c.drawString(tx, H - 20*mm, "Web Designer & Developer  |  Digital Specialist")
    c.drawString(tx, H - 26*mm, f"altamura.mauro@gmail.com  |  Monopoli (BA)")
    c.setFillColor(WHITE)
    c.setFont("NotoSans-Bold", 11)
    c.drawRightString(W - MARGIN_R, H - 14*mm, "PREVENTIVO")
    c.setFont("NotoSans", 9)
    c.setFillColor(DUST_GRAY)
    c.drawRightString(W - MARGIN_R, H - 20*mm, DATA)

def draw_footer(c, doc):
    c.setStrokeColor(DUST_GRAY)
    c.setLineWidth(0.5)
    c.line(MARGIN_L, 13*mm, W - MARGIN_R, 13*mm)
    c.setFont("NotoSans", 7.5)
    c.setFillColor(DUST_GRAY)
    c.drawString(MARGIN_L, 9*mm,
        f"Mauro Altamura  ·  altamura.mauro@gmail.com  ·  Monopoli (BA)  ·  P.IVA: {MAURO_PIVA}")
    c.drawRightString(W - MARGIN_R, 9*mm, "Preventivo")

def on_page(c, doc):
    draw_header(c, doc)
    draw_footer(c, doc)

# ── PHASE TABLE ─────────────────────────────────────────────────────
def phase_block(label, titolo, periodo, voci, deliverable=""):
    els = []
    hd = [[Paragraph(f"<b>{label}</b>  ·  {titolo}", S_WHITE_B)]]
    ht = Table(hd, colWidths=[CONTENT_W])
    ht.setStyle(TableStyle([
        ('BACKGROUND',  (0,0),(-1,-1), IRON_GRAY),
        ('TOPPADDING',  (0,0),(-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING', (0,0),(-1,-1), 8),
        ('RIGHTPADDING',(0,0),(-1,-1), 8),
        ('VALIGN',      (0,0),(-1,-1), 'MIDDLE'),
    ]))
    els.append(ht)
    pd = [[Paragraph(f"<b>Periodo:</b>  {periodo}", S_SMALL)]]
    pt = Table(pd, colWidths=[CONTENT_W])
    pt.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), LIGHT_BG),
        ('TOPPADDING',   (0,0),(-1,-1), 5),
        ('BOTTOMPADDING',(0,0),(-1,-1), 5),
        ('LEFTPADDING',  (0,0),(-1,-1), 8),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
    ]))
    els.append(pt)
    rows = [[[Paragraph(f"<font color='#FF006E'>—</font>  {v}",
              S("vi", size=9, color=IRON_GRAY, spaceBefore=0, spaceAfter=0))]]
            for v in voci]
    it = Table(rows, colWidths=[CONTENT_W])
    it.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), WHITE),
        ('TOPPADDING',   (0,0),(-1,-1), 4),
        ('BOTTOMPADDING',(0,0),(-1,-1), 4),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ('RIGHTPADDING', (0,0),(-1,-1), 8),
        ('LINEBELOW',    (0,0),(-1,-2), 0.3, DUST_GRAY),
        ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
    ]))
    els.append(it)
    if deliverable:
        dd = [[
            Paragraph("DELIVERABLE", S("dl", size=7, color=NEON_PINK, bold=True)),
            Paragraph(deliverable,   S("dv", size=8.5, color=IRON_GRAY))
        ]]
        dt = Table(dd, colWidths=[CONTENT_W*0.20, CONTENT_W*0.80])
        dt.setStyle(TableStyle([
            ('BACKGROUND',   (0,0),(-1,-1), PINK_LIGHT),
            ('TOPPADDING',   (0,0),(-1,-1), 6),
            ('BOTTOMPADDING',(0,0),(-1,-1), 6),
            ('LEFTPADDING',  (0,0),(0,0),   8),
            ('LEFTPADDING',  (1,0),(1,0),   4),
            ('RIGHTPADDING', (0,0),(-1,-1), 8),
            ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
            ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
        ]))
        els.append(dt)
    els.append(Spacer(1, 5*mm))
    return els

# ── LISTA TABLE ─────────────────────────────────────────────────────
def lista_block(voci):
    rows = []
    for i, (nome, desc, prezzo) in enumerate(voci):
        bg = LIGHT_BG if i % 2 == 0 else WHITE
        if desc:
            nome_cell = Paragraph(f"<b>{nome}</b><br/><font size='8' color='#4C5760'>{desc}</font>",
                                  S("ln", size=9.5, color=IRON_GRAY))
        else:
            nome_cell = Paragraph(f"<b>{nome}</b>", S("ln2", size=9.5, color=IRON_GRAY, bold=True))
        prezzo_cell = Paragraph(prezzo, S("lp", size=11, color=NEON_PINK, bold=True, align=TA_RIGHT))
        rows.append([nome_cell, prezzo_cell])
    t = Table(rows, colWidths=[CONTENT_W*0.68, CONTENT_W*0.32])
    styles = [
        ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
        ('LINEBELOW',    (0,0),(-1,-2), 0.3, DUST_GRAY),
        ('TOPPADDING',   (0,0),(-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ('RIGHTPADDING', (0,0),(-1,-1), 10),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
    ]
    for i in range(len(rows)):
        bg = LIGHT_BG if i % 2 == 0 else WHITE
        styles.append(('BACKGROUND', (0,i),(-1,i), bg))
    t.setStyle(TableStyle(styles))
    return t

# ── BUILD ────────────────────────────────────────────────────────────
frame = Frame(MARGIN_L, MARGIN_B, CONTENT_W,
              H - HEADER_H - MARGIN_B - 6*mm,
              leftPadding=0, rightPadding=0, topPadding=4*mm, bottomPadding=0)
doc = BaseDocTemplate(OUTPUT, pagesize=A4,
                      leftMargin=MARGIN_L, rightMargin=MARGIN_R,
                      topMargin=HEADER_H+4*mm, bottomMargin=MARGIN_B+6*mm)
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=on_page)])

story = []

# ── DESTINATARIO ─────────────────────────────────────────────────────
dest_rows = [
    [Paragraph("DESTINATARIO", S("dt", size=7, color=NEON_PINK, bold=True, spaceAfter=4)),
     Paragraph("VALIDITÀ",     S("dt2",size=7, color=NEON_PINK, bold=True, align=TA_RIGHT, spaceAfter=4))],
    [Paragraph(f"<b>{CLIENTE_NOME}</b>", S("dn", size=11, color=IRON_GRAY, bold=True, spaceAfter=2)),
     Paragraph("30 giorni dalla data di emissione", S("dv", size=9, color=IRON_GRAY, align=TA_RIGHT))],
]
if CLIENTE_PIVA:
    dest_rows.append([
        Paragraph(f"P.IVA: {CLIENTE_PIVA}", S("dp", size=9, color=IRON_GRAY)),
        Paragraph("", S_BODY)
    ])
dest_t = Table(dest_rows, colWidths=[CONTENT_W*0.65, CONTENT_W*0.35])
dest_t.setStyle(TableStyle([
    ('BACKGROUND',   (0,0),(-1,-1), LIGHT_BG),
    ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
    ('LINEBELOW',    (0,0),(-1,0),  0.5, DUST_GRAY),
    ('TOPPADDING',   (0,0),(-1,-1), 5),
    ('BOTTOMPADDING',(0,0),(-1,-1), 5),
    ('LEFTPADDING',  (0,0),(-1,-1), 10),
    ('RIGHTPADDING', (0,0),(-1,-1), 10),
    ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
]))
story.append(dest_t)
story.append(Spacer(1, 6*mm))

# ── OGGETTO ──────────────────────────────────────────────────────────
story.append(SectionTitle(f"Oggetto: {OGGETTO_TITOLO}", CONTENT_W))
story.append(Spacer(1, 2*mm))
story.append(Paragraph(OGGETTO_TESTO, S_BODY))
story.append(Spacer(1, 5*mm))

# ── VOCI (FASI o LISTA) ──────────────────────────────────────────────
story.append(SectionTitle("Dettaglio attività", CONTENT_W))
story.append(Spacer(1, 2*mm))

if MODALITA_VOCI == "fasi":
    for fase in VOCI_FASI:
        story.extend(phase_block(
            fase["label"], fase["titolo"], fase["periodo"],
            fase["voci"], fase.get("deliverable", "")
        ))
else:
    story.append(lista_block(VOCI_LISTA))
    story.append(Spacer(1, 5*mm))

# ── TEMPI DI CONSEGNA (opzionale) ────────────────────────────────────
if 'TEMPI_CONSEGNA' in dir() or 'TEMPI_CONSEGNA' in globals():
    story.append(SectionTitle("Tempi di consegna", CONTENT_W))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(TEMPI_CONSEGNA, S_BODY))
    story.append(Spacer(1, 5*mm))

# ── GARANZIA POST-LANCIO (opzionale) ─────────────────────────────────
if 'GARANZIA_TESTO' in dir() or 'GARANZIA_TESTO' in globals():
    story.append(SectionTitle("Garanzia post-lancio", CONTENT_W))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(GARANZIA_TESTO, S_BODY))
    story.append(Spacer(1, 5*mm))

# ── COSA NON INCLUDE (opzionale) ─────────────────────────────────────
if 'COSA_NON_INCLUDE' in dir() or 'COSA_NON_INCLUDE' in globals():
    story.append(SectionTitle("Cosa non include questo preventivo", CONTENT_W))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(
        "Il presente preventivo non comprende:", S_BODY))
    story.append(Spacer(1, 1*mm))
    for item in COSA_NON_INCLUDE:
        story.append(bullet(item))
    story.append(Spacer(1, 5*mm))

# ── PIANO DI MANUTENZIONE (opzionale) ────────────────────────────────
if 'MANUTENZIONE_ATTIVA' in globals() and MANUTENZIONE_ATTIVA:
    story.append(SectionTitle("Piano di Manutenzione", CONTENT_W))
    story.append(Spacer(1, 2*mm))
    mnt_data = [[
        Paragraph(MANUTENZIONE_TESTO, S("mt", size=9, color=IRON_GRAY, spaceAfter=0)),
        Paragraph(MANUTENZIONE_PREZZO, S("mp", size=12, color=NEON_PINK, bold=True, align=TA_RIGHT))
    ]]
    mnt_t = Table(mnt_data, colWidths=[CONTENT_W*0.68, CONTENT_W*0.32])
    mnt_t.setStyle(TableStyle([
        ('BACKGROUND',   (0,0),(-1,-1), LIGHT_BG),
        ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
        ('TOPPADDING',   (0,0),(-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ('RIGHTPADDING', (0,0),(-1,-1), 10),
        ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
    ]))
    story.append(mnt_t)
    story.append(Spacer(1, 5*mm))

# ── COMPENSO ─────────────────────────────────────────────────────────
story.append(SectionTitle("Compenso e modalità di pagamento", CONTENT_W))
story.append(Spacer(1, 2*mm))

comp_data = [
    [Paragraph("Compenso totale", S("cl", size=9, color=IRON_GRAY, bold=True)),
     Paragraph(COMPENSO_TOTALE,   S("cv", size=14, color=NEON_PINK, bold=True, align=TA_RIGHT))],
    [Paragraph("Modalità di pagamento", S("ml", size=8.5, color=IRON_GRAY, bold=True)),
     Paragraph(MODALITA_PAGAMENTO, S("mv", size=8.5, color=IRON_GRAY, align=TA_RIGHT))],
]
comp_t = Table(comp_data, colWidths=[CONTENT_W*0.4, CONTENT_W*0.6])
comp_t.setStyle(TableStyle([
    ('BACKGROUND',   (0,0),(-1,0), LIGHT_BG),
    ('BACKGROUND',   (0,1),(-1,1), WHITE),
    ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
    ('LINEBELOW',    (0,0),(-1,-2), 0.3, DUST_GRAY),
    ('TOPPADDING',   (0,0),(-1,-1), 7),
    ('BOTTOMPADDING',(0,0),(-1,-1), 7),
    ('LEFTPADDING',  (0,0),(-1,-1), 10),
    ('RIGHTPADDING', (0,0),(-1,-1), 10),
    ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
]))
story.append(comp_t)
story.append(Spacer(1, 4*mm))

# Tranches
tranches = calcola_tranches(COMPENSO_TOTALE, SCHEMA_PAGAMENTO)
story.append(Paragraph("Il compenso è suddiviso in 2 tranches:", S_BODY_B))
story.append(Spacer(1, 1*mm))
tr_data = [
    [Paragraph(t[0], S("tl", size=9, color=WHITE, bold=True)),
     Paragraph(t[1], S("td", size=9, color=IRON_GRAY)),
     Paragraph(t[2], S("tv", size=11, color=NEON_PINK, bold=True, align=TA_RIGHT))]
    for t in tranches
]
tr_t = Table(tr_data, colWidths=[CONTENT_W*0.18, CONTENT_W*0.55, CONTENT_W*0.27])
tr_styles = [
    ('BACKGROUND',   (0,0),(0,-1), IRON_GRAY),
    ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
    ('LINEBELOW',    (0,0),(-1,0),  0.3, DUST_GRAY),
    ('TOPPADDING',   (0,0),(-1,-1), 7),
    ('BOTTOMPADDING',(0,0),(-1,-1), 7),
    ('LEFTPADDING',  (0,0),(-1,-1), 10),
    ('RIGHTPADDING', (0,0),(-1,-1), 10),
    ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
]
for i, _ in enumerate(tranches):
    bg = LIGHT_BG if i % 2 == 0 else WHITE
    tr_styles.append(('BACKGROUND', (1,i),(-1,i), bg))
tr_t.setStyle(TableStyle(tr_styles))
story.append(tr_t)
story.append(Spacer(1, 5*mm))

# ── FASI SUCCESSIVE (opzionale) ───────────────────────────────────────
if 'FASI_SUCCESSIVE_TESTO' in dir() or 'FASI_SUCCESSIVE_TESTO' in globals():
    story.append(SectionTitle("Fasi successive", CONTENT_W))
    story.append(Spacer(1, 2*mm))
    story.append(Paragraph(FASI_SUCCESSIVE_TESTO, S_BODY))
    story.append(Spacer(1, 6*mm))

# ── ACCETTAZIONE ──────────────────────────────────────────────────────
story.append(SectionTitle("Accettazione", CONTENT_W))
story.append(Spacer(1, 2*mm))
story.append(Paragraph(
    "Il presente preventivo ha validità 30 giorni dalla data di emissione. "
    "L'accettazione avviene mediante firma della presente e restituzione via email.",
    S("valid", size=9, color=IRON_GRAY, spaceAfter=6)))
story.append(Spacer(1, 4*mm))

sign_data = [
    [Paragraph("Per accettazione<br/><b>" + CLIENTE_NOME + "</b>",
               S("sl", size=9, color=IRON_GRAY, spaceAfter=16)),
     Paragraph("Il professionista<br/><b>Mauro Altamura</b>",
               S("sr", size=9, color=IRON_GRAY, align=TA_RIGHT, spaceAfter=16))],
    [Paragraph("Firma e timbro: _________________________________",
               S("sfl", size=8.5, color=DUST_GRAY)),
     Paragraph("Firma: _________________________________",
               S("sfr", size=8.5, color=DUST_GRAY, align=TA_RIGHT))],
    [Paragraph("Data: ______________________",
               S("sdl", size=8.5, color=DUST_GRAY)),
     Paragraph("", S_BODY)],
]
sign_t = Table(sign_data, colWidths=[CONTENT_W*0.5, CONTENT_W*0.5])
sign_t.setStyle(TableStyle([
    ('BACKGROUND',   (0,0),(-1,-1), LIGHT_BG),
    ('BOX',          (0,0),(-1,-1), 0.5, DUST_GRAY),
    ('TOPPADDING',   (0,0),(-1,-1), 8),
    ('BOTTOMPADDING',(0,0),(-1,-1), 8),
    ('LEFTPADDING',  (0,0),(-1,-1), 10),
    ('RIGHTPADDING', (0,0),(-1,-1), 10),
    ('VALIGN',       (0,0),(-1,-1), 'TOP'),
]))
story.append(sign_t)

doc.build(story)
print(f"✓ PDF generato: {OUTPUT}")
