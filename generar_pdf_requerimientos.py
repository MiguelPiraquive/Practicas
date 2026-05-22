"""
Genera REQUERIMIENTOS.pdf — documento profesional para presentación.
Ejecutar:  python generar_pdf_requerimientos.py
"""

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# === Paleta corporativa ===
TEAL = colors.HexColor("#0d9488")
TEAL_DARK = colors.HexColor("#115e59")
SLATE = colors.HexColor("#334155")
SLATE_LIGHT = colors.HexColor("#64748b")
GRAY_BG = colors.HexColor("#f1f5f9")
BORDER = colors.HexColor("#cbd5e1")


def build_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title", parent=base["Title"], fontSize=22, leading=26,
            textColor=TEAL_DARK, spaceAfter=4, alignment=TA_LEFT,
            fontName="Helvetica-Bold",
        ),
        "subtitle": ParagraphStyle(
            "Subtitle", parent=base["Normal"], fontSize=11, leading=14,
            textColor=SLATE_LIGHT, spaceAfter=18, fontName="Helvetica",
        ),
        "h1": ParagraphStyle(
            "H1", parent=base["Heading1"], fontSize=14, leading=18,
            textColor=TEAL_DARK, spaceBefore=14, spaceAfter=8,
            fontName="Helvetica-Bold",
            borderPadding=(0, 0, 4, 0),
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontSize=11.5, leading=15,
            textColor=SLATE, spaceBefore=8, spaceAfter=4,
            fontName="Helvetica-Bold",
        ),
        "body": ParagraphStyle(
            "Body", parent=base["Normal"], fontSize=10, leading=14,
            textColor=SLATE, spaceAfter=4, alignment=TA_JUSTIFY,
            fontName="Helvetica",
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["Normal"], fontSize=10, leading=14,
            textColor=SLATE, leftIndent=14, bulletIndent=2,
            fontName="Helvetica",
        ),
        "small": ParagraphStyle(
            "Small", parent=base["Normal"], fontSize=8.5, leading=11,
            textColor=SLATE_LIGHT, fontName="Helvetica-Oblique",
        ),
        "code": ParagraphStyle(
            "Code", parent=base["Normal"], fontSize=8.5, leading=11,
            textColor=SLATE, fontName="Courier",
            backColor=GRAY_BG, borderPadding=4, leftIndent=4, rightIndent=4,
        ),
    }


# === Encabezado/pie con marca ===
def header_footer(canvas, doc):
    canvas.saveState()
    width, height = LETTER

    # Header band
    canvas.setFillColor(TEAL_DARK)
    canvas.rect(0, height - 1.4 * cm, width, 1.4 * cm, fill=True, stroke=False)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawString(2 * cm, height - 0.9 * cm, "Clínica Junical")
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(
        width - 2 * cm, height - 0.9 * cm,
        "Sistema de Ventanilla de Historias Clínicas",
    )

    # Footer
    canvas.setStrokeColor(BORDER)
    canvas.line(2 * cm, 1.5 * cm, width - 2 * cm, 1.5 * cm)
    canvas.setFillColor(SLATE_LIGHT)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2 * cm, 1.1 * cm,
                      f"Documento de Requerimientos · {date.today().strftime('%d/%m/%Y')}")
    canvas.drawRightString(width - 2 * cm, 1.1 * cm,
                           f"Página {doc.page}")
    canvas.restoreState()


def make_table(data, col_widths, header=True):
    style = [
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TEXTCOLOR", (0, 0), (-1, -1), SLATE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1 if header else 0), (-1, -1),
         [colors.white, GRAY_BG]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, BORDER),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle(style))
    return t


def main():
    out_path = Path(__file__).parent / "REQUERIMIENTOS.pdf"

    doc = SimpleDocTemplate(
        str(out_path), pagesize=LETTER,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="Requerimientos Técnicos — Sistema de Ventanilla de HC",
        author="Clínica Junical",
    )
    s = build_styles()
    story = []

    # === Portada ===
    story.append(Spacer(1, 1 * cm))
    story.append(Paragraph("Requerimientos Técnicos", s["title"]))
    story.append(Paragraph(
        "Sistema de Ventanilla de Historias Clínicas — Clínica Junical",
        s["subtitle"],
    ))

    portada_info = [
        ["Versión", "Borrador para presentación"],
        ["Fecha", date.today().strftime("%d de %B de %Y")],
        ["Audiencia", "Dirección administrativa, área de sistemas"],
        ["Alcance", "Hardware, software, integraciones, seguridad y mantenimiento"],
    ]
    story.append(make_table(portada_info, [4 * cm, 12 * cm], header=False))
    story.append(Spacer(1, 0.7 * cm))

    story.append(Paragraph(
        "Este documento describe los recursos técnicos —físicos y lógicos— necesarios "
        "para la operación del sistema de ventanilla de historias clínicas, las "
        "integraciones con servicios externos, el modelo de seguridad y el plan de "
        "mantenimiento. Está redactado de forma resumida y orientada a una toma de "
        "decisiones rápida.",
        s["body"],
    ))

    # === 1. Requerimientos físicos ===
    story.append(Paragraph("1. Requerimientos físicos (hardware)", s["h1"]))

    story.append(Paragraph("Servidor (donde corre el sistema)", s["h2"]))
    story.append(make_table([
        ["Componente", "Mínimo", "Recomendado"],
        ["Procesador", "Intel Core i3 / AMD Ryzen 3", "Intel i5 / Ryzen 5"],
        ["Memoria RAM", "4 GB", "8 GB"],
        ["Disco duro", "20 GB libres", "50 GB SSD"],
        ["Red", "Conexión a internet estable", "LAN clínica + internet"],
    ], [4.5 * cm, 5.5 * cm, 6 * cm]))

    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Equipos de los usuarios (ventanilla)", s["h2"]))
    story.append(make_table([
        ["Componente", "Mínimo"],
        ["Procesador", "Cualquier PC moderno (≥ 2018)"],
        ["Memoria RAM", "4 GB"],
        ["Pantalla", "1366 × 768 mínimo"],
        ["Navegador", "Chrome, Edge o Firefox actual"],
        ["Periféricos", "Teclado, mouse, conexión a red"],
    ], [4.5 * cm, 11.5 * cm]))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        "<i>No requiere instalación de software en los equipos de los usuarios. "
        "El acceso es exclusivamente por navegador web.</i>",
        s["body"],
    ))

    # === 2. Requerimientos lógicos ===
    story.append(Paragraph("2. Requerimientos lógicos (software)", s["h1"]))

    story.append(Paragraph("Software del servidor", s["h2"]))
    for item in [
        "Sistema operativo: Windows 10/11, Linux (Ubuntu 20.04+) o Windows Server.",
        "Python 3.11 o superior.",
        "Node.js 18 o superior (solo para recompilar el frontend).",
        "PostgreSQL 14 o superior como base de datos.",
        "Git, para clonado y actualización del proyecto.",
    ]:
        story.append(Paragraph(f"• {item}", s["bullet"]))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Librerías Python principales", s["h2"]))
    for item in [
        "Django 6.x — framework web.",
        "Django REST Framework — API.",
        "djangorestframework-simplejwt — autenticación con tokens.",
        "psycopg2-binary — conector PostgreSQL.",
        "openpyxl — exportación a Excel.",
        "reportlab — generación de PDFs (modo simulación de Hosvital).",
        "requests — llamadas a APIs externas.",
        "beautifulsoup4 — scraping de fuentes públicas.",
        "python-dotenv — manejo de variables de entorno.",
    ]:
        story.append(Paragraph(f"• {item}", s["bullet"]))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Librerías Frontend principales", s["h2"]))
    for item in [
        "React 18 + Vite 8.",
        "React Router DOM 6.",
        "Axios para consumo de la API.",
    ]:
        story.append(Paragraph(f"• {item}", s["bullet"]))

    # === 3. Servicios externos ===
    story.append(PageBreak())
    story.append(Paragraph("3. Servicios externos", s["h1"]))
    story.append(make_table([
        ["Servicio", "Función", "Estado"],
        ["API Hosvital", "Descargar el PDF real de la historia clínica.",
         "Pendiente de credenciales."],
        ["Servidor SMTP (Gmail)", "Envío de la HC por correo.",
         "Configurable. Funciona con app password."],
        ["Twilio WhatsApp", "Envío de la HC por WhatsApp.",
         "Opcional. Modo simulado disponible."],
        ["Procuraduría / Policía / Contraloría / ADRES",
         "Autocompletado de datos del paciente.",
         "Funciona sin credenciales (fuentes públicas)."],
    ], [4.5 * cm, 6.5 * cm, 5 * cm]))

    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph(
        "Cada servicio se configura en el archivo <font face='Courier'>backend/.env</font>. "
        "El sistema funciona aunque alguno de los servicios externos no esté disponible: "
        "en ese caso entra en modo de simulación, lo que permite presentar y operar el "
        "flujo completo sin bloqueos.",
        s["body"],
    ))

    # === 4. Arquitectura ===
    story.append(Paragraph("4. Arquitectura general", s["h1"]))
    story.append(Paragraph(
        "El sistema sigue una arquitectura cliente-servidor de tres capas: navegador, "
        "backend Django y base de datos PostgreSQL. Las integraciones externas se "
        "conectan exclusivamente desde el backend.",
        s["body"],
    ))
    arq = [
        ["Capa", "Tecnología", "Responsabilidad"],
        ["Frontend", "React + Vite",
         "Interfaz de usuario en navegador. Sin instalación local."],
        ["Backend", "Django + DRF",
         "Lógica de negocio, API REST, autenticación, integraciones."],
        ["Base de datos", "PostgreSQL",
         "Persistencia de pacientes, solicitudes, usuarios y bitácora."],
        ["Almacenamiento", "Sistema de archivos (carpeta media/)",
         "PDFs de las historias clínicas descargados."],
        ["Integraciones", "Hosvital, SMTP, Twilio, fuentes públicas",
         "Servicios externos consumidos por el backend."],
    ]
    story.append(make_table(arq, [3 * cm, 4 * cm, 9 * cm]))

    # === 5. Configuración ===
    story.append(Paragraph("5. Configuración inicial", s["h1"]))
    story.append(Paragraph("Comandos del backend", s["h2"]))
    story.append(Paragraph(
        "cd backend<br/>"
        ".\\.venv\\Scripts\\Activate.ps1<br/>"
        "pip install -r requirements.txt<br/>"
        "python manage.py migrate<br/>"
        "python manage.py createsuperuser<br/>"
        "python manage.py runserver",
        s["code"],
    ))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Comandos del frontend", s["h2"]))
    story.append(Paragraph(
        "cd frontend<br/>"
        "npm install<br/>"
        "npm run dev",
        s["code"],
    ))

    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Variables del archivo backend/.env", s["h2"]))
    env = [
        ["Variable", "Descripción"],
        ["DATABASE_NAME / USER / PASSWORD / HOST / PORT",
         "Conexión a PostgreSQL."],
        ["HOSVITAL_API_URL / HOSVITAL_API_TOKEN",
         "Credenciales de la API de Hosvital."],
        ["EMAIL_HOST / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD",
         "SMTP para envío de correos."],
        ["TWILIO_ACCOUNT_SID / AUTH_TOKEN / WHATSAPP_FROM",
         "Credenciales de WhatsApp Business."],
    ]
    story.append(make_table(env, [6 * cm, 10 * cm]))

    # === 6. Seguridad ===
    story.append(PageBreak())
    story.append(Paragraph("6. Seguridad", s["h1"]))
    for item in [
        "Autenticación basada en JWT, con tokens firmados y expiración configurable.",
        "CORS restringido a las direcciones explícitamente permitidas.",
        "Bitácora completa de acciones críticas (qué, quién, cuándo).",
        "Contraseñas almacenadas con hash PBKDF2 (estándar de Django).",
        "Variables sensibles fuera del código fuente, en archivo .env.",
        "Conexión recomendada por HTTPS en ambiente productivo.",
        "Validación de roles y permisos: administrador y ventanilla.",
    ]:
        story.append(Paragraph(f"• {item}", s["bullet"]))

    # === 7. Datos almacenados ===
    story.append(Paragraph("7. Datos almacenados", s["h1"]))
    story.append(make_table([
        ["Entidad", "Información principal"],
        ["Pacientes", "Documento, nombre, teléfono, fecha de nacimiento, contacto."],
        ["Solicitudes", "Los 20 campos del Excel real, estados y PDFs asociados."],
        ["Usuarios", "Funcionarios con rol (administrador / ventanilla)."],
        ["Bitácora", "Auditoría completa: acción, usuario, fecha, detalle."],
        ["PDFs de HC", "Archivos descargados desde Hosvital (carpeta media/)."],
    ], [4 * cm, 12 * cm]))

    # === 8. Mantenimiento ===
    story.append(Paragraph("8. Mantenimiento", s["h1"]))
    for item in [
        "Backup diario automatizado de la base de datos PostgreSQL (pg_dump).",
        "Backup semanal de la carpeta backend/media/ (PDFs guardados).",
        "Revisión semanal de la bitácora en busca de eventos atípicos.",
        "Actualización trimestral de dependencias: pip install -U -r requirements.txt.",
        "Pruebas de restauración del backup al menos una vez al mes.",
    ]:
        story.append(Paragraph(f"• {item}", s["bullet"]))

    # === 9. Conclusión ===
    story.append(Paragraph("9. Conclusión", s["h1"]))
    story.append(Paragraph(
        "El sistema está diseñado para operar con recursos modestos, sin instalación "
        "en los equipos de los usuarios y con tolerancia a la indisponibilidad de "
        "servicios externos mediante modos de simulación. Esto permite presentar y "
        "comenzar la operación de inmediato, mientras se gestiona la habilitación "
        "definitiva de las integraciones con Hosvital, el servidor de correo y "
        "WhatsApp Business.",
        s["body"],
    ))

    # === Build ===
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"PDF generado: {out_path}")


if __name__ == "__main__":
    main()
