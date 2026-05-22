"""
Genera PLANTILLA_REQUERIMIENTOS_IEEE830.pdf en formato ICONTEC (NTC 1486).

Características aplicadas:
- Tipografía Times-Roman 12pt
- Interlineado 1.5
- Texto justificado
- Márgenes: superior 3 cm, izquierdo 4 cm (encuadernación), derecho 2 cm, inferior 3 cm
- Títulos de primer nivel: MAYÚSCULAS, centrados, negrita
- Títulos de segundo nivel: MAYÚSCULAS, alineados a la izquierda, negrita
- Numeración decimal (1, 1.1, 1.1.1)
- Paginación arábiga en parte superior derecha desde la introducción
- Portada y portada interior conforme NTC 1486
- Tablas en blanco y negro, formales
- Sin elementos decorativos de color
"""

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.units import cm

# === Paleta sobria (ICONTEC: blanco y negro) ===
BLACK = colors.HexColor("#000000")
GRAY_MID = colors.HexColor("#4d4d4d")
GRAY_BG = colors.HexColor("#ededed")
PLACEHOLDER = colors.HexColor("#7a7a7a")
BORDER = colors.HexColor("#000000")

FONT = "Times-Roman"
FONT_BOLD = "Times-Bold"
FONT_ITALIC = "Times-Italic"


def build_styles():
    base = getSampleStyleSheet()
    return {
        "cover_title": ParagraphStyle(
            "CoverTitle", parent=base["Normal"], fontSize=14, leading=22,
            textColor=BLACK, alignment=TA_CENTER, fontName=FONT_BOLD,
            spaceAfter=4,
        ),
        "cover_text": ParagraphStyle(
            "CoverText", parent=base["Normal"], fontSize=12, leading=18,
            textColor=BLACK, alignment=TA_CENTER, fontName=FONT,
        ),
        "cover_text_bold": ParagraphStyle(
            "CoverTextBold", parent=base["Normal"], fontSize=12, leading=18,
            textColor=BLACK, alignment=TA_CENTER, fontName=FONT_BOLD,
        ),
        "h1": ParagraphStyle(
            "H1", parent=base["Heading1"], fontSize=14, leading=22,
            textColor=BLACK, spaceBefore=18, spaceAfter=14,
            fontName=FONT_BOLD, alignment=TA_CENTER,
        ),
        "h2": ParagraphStyle(
            "H2", parent=base["Heading2"], fontSize=12, leading=20,
            textColor=BLACK, spaceBefore=14, spaceAfter=8,
            fontName=FONT_BOLD, alignment=TA_LEFT,
        ),
        "h3": ParagraphStyle(
            "H3", parent=base["Heading3"], fontSize=12, leading=18,
            textColor=BLACK, spaceBefore=8, spaceAfter=4,
            fontName=FONT_BOLD, alignment=TA_LEFT,
        ),
        "body": ParagraphStyle(
            "Body", parent=base["Normal"], fontSize=12, leading=18,
            textColor=BLACK, spaceAfter=8, alignment=TA_JUSTIFY,
            fontName=FONT,
        ),
        "body_indent": ParagraphStyle(
            "BodyIndent", parent=base["Normal"], fontSize=12, leading=18,
            textColor=BLACK, spaceAfter=6, alignment=TA_JUSTIFY,
            fontName=FONT, firstLineIndent=24,
        ),
        "hint": ParagraphStyle(
            "Hint", parent=base["Normal"], fontSize=11, leading=15,
            textColor=GRAY_MID, spaceAfter=6, alignment=TA_JUSTIFY,
            fontName=FONT_ITALIC, leftIndent=12, rightIndent=4,
        ),
        "bullet": ParagraphStyle(
            "Bullet", parent=base["Normal"], fontSize=12, leading=18,
            textColor=BLACK, leftIndent=24, bulletIndent=12,
            spaceAfter=4, fontName=FONT, alignment=TA_JUSTIFY,
        ),
    }


def page_with_number(canvas, doc):
    """Numeración arábiga en esquina superior derecha."""
    canvas.saveState()
    width, height = LETTER
    canvas.setFillColor(BLACK)
    canvas.setFont(FONT, 11)
    canvas.drawRightString(width - 2 * cm, height - 1.5 * cm, f"{doc.page}")
    canvas.restoreState()


def cover_blank(canvas, doc):
    """Portada sin numerar (NTC 1486)."""
    pass


def make_table(data, col_widths, header=True):
    style = [
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TEXTCOLOR", (0, 0), (-1, -1), BLACK),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), GRAY_BG),
            ("FONTNAME", (0, 0), (-1, 0), FONT_BOLD),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle(style))
    return t


def ph(text):
    return f'<font color="#7a7a7a"><i>{text}</i></font>'


def main():
    out_path = Path(__file__).parent / "PLANTILLA_REQUERIMIENTOS_IEEE830.pdf"

    doc = SimpleDocTemplate(
        str(out_path), pagesize=LETTER,
        leftMargin=4 * cm, rightMargin=2 * cm,
        topMargin=3 * cm, bottomMargin=3 * cm,
        title="Plantilla ERS — IEEE 830 (formato ICONTEC)",
        author="Plantilla profesional",
    )
    s = build_styles()
    story = []

    # ===== PORTADA NTC 1486 =====
    story.append(Spacer(1, 2 * cm))
    story.append(Paragraph("ESPECIFICACIÓN DE REQUISITOS DEL SOFTWARE",
                           s["cover_title"]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(ph("[NOMBRE DEL PROYECTO]"), s["cover_title"]))

    story.append(Spacer(1, 4 * cm))
    story.append(Paragraph(ph("[NOMBRE COMPLETO DEL AUTOR]"), s["cover_text_bold"]))
    story.append(Paragraph(ph("[Cargo o rol del autor]"), s["cover_text"]))

    story.append(Spacer(1, 5 * cm))
    story.append(Paragraph(ph("[NOMBRE DE LA INSTITUCIÓN / EMPRESA]"),
                           s["cover_text_bold"]))
    story.append(Paragraph(ph("[Área o dependencia]"), s["cover_text"]))
    story.append(Paragraph(ph("[CIUDAD]"), s["cover_text"]))
    story.append(Paragraph(str(date.today().year), s["cover_text"]))
    story.append(PageBreak())

    # ===== PORTADA INTERIOR =====
    story.append(Spacer(1, 2 * cm))
    story.append(Paragraph("ESPECIFICACIÓN DE REQUISITOS DEL SOFTWARE",
                           s["cover_title"]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(ph("[NOMBRE DEL PROYECTO]"), s["cover_title"]))

    story.append(Spacer(1, 2.5 * cm))
    story.append(Paragraph(ph("[NOMBRE COMPLETO DEL AUTOR]"), s["cover_text_bold"]))

    story.append(Spacer(1, 2 * cm))
    story.append(Paragraph(
        "Documento elaborado como entrega técnica para la implementación del "
        "sistema en la organización destinataria, siguiendo los lineamientos "
        "del estándar IEEE 830-1998.",
        ParagraphStyle("CoverDesc", parent=s["body"], alignment=TA_CENTER,
                       leftIndent=3 * cm, rightIndent=0),
    ))

    story.append(Spacer(1, 2 * cm))
    story.append(Paragraph(ph("[RESPONSABLE TÉCNICO / DIRECTOR DE PROYECTO]"),
                           s["cover_text_bold"]))
    story.append(Paragraph(ph("[Cargo]"), s["cover_text"]))

    story.append(Spacer(1, 3 * cm))
    story.append(Paragraph(ph("[NOMBRE DE LA INSTITUCIÓN / EMPRESA]"),
                           s["cover_text_bold"]))
    story.append(Paragraph(ph("[Área o dependencia]"), s["cover_text"]))
    story.append(Paragraph(ph("[CIUDAD]"), s["cover_text"]))
    story.append(Paragraph(str(date.today().year), s["cover_text"]))
    story.append(PageBreak())

    # ===== CONTENIDO =====
    story.append(Paragraph("CONTENIDO", s["h1"]))
    story.append(Spacer(1, 0.3 * cm))
    toc_lines = [
        ("INTRODUCCIÓN", "1"),
        ("1.  GENERALIDADES DEL DOCUMENTO", "2"),
        ("1.1  PROPÓSITO", "2"),
        ("1.2  ALCANCE", "2"),
        ("1.3  DEFINICIONES, ACRÓNIMOS Y ABREVIATURAS", "3"),
        ("1.4  REFERENCIAS", "3"),
        ("1.5  VISIÓN GENERAL DEL DOCUMENTO", "3"),
        ("2.  DESCRIPCIÓN GENERAL", "4"),
        ("2.1  PERSPECTIVA DEL PRODUCTO", "4"),
        ("2.2  FUNCIONES DEL PRODUCTO", "4"),
        ("2.3  CARACTERÍSTICAS DE LOS USUARIOS", "5"),
        ("2.4  RESTRICCIONES GENERALES", "5"),
        ("2.5  SUPOSICIONES Y DEPENDENCIAS", "5"),
        ("2.6  REQUISITOS FUTUROS", "5"),
        ("3.  REQUISITOS ESPECÍFICOS", "6"),
        ("3.1  REQUISITOS FUNCIONALES", "6"),
        ("3.2  REQUISITOS NO FUNCIONALES", "7"),
        ("3.3  REQUISITOS DE INTERFACES", "8"),
        ("4.  APÉNDICES", "9"),
        ("4.1  GLOSARIO", "9"),
        ("4.2  MODELO DE DATOS", "9"),
        ("4.3  DIAGRAMA DE ARQUITECTURA", "9"),
        ("4.4  CASOS DE USO", "10"),
        ("4.5  MATRIZ DE TRAZABILIDAD", "10"),
        ("4.6  CRONOGRAMA", "10"),
        ("4.7  PLAN DE DESPLIEGUE", "11"),
        ("4.8  PLAN DE CAPACITACIÓN", "11"),
        ("4.9  APROBACIÓN", "11"),
        ("BIBLIOGRAFÍA", "12"),
    ]
    toc_table = Table([[t, p] for t, p in toc_lines], colWidths=[12.5 * cm, 1.5 * cm])
    toc_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), 11.5),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("TEXTCOLOR", (0, 0), (-1, -1), BLACK),
    ]))
    story.append(toc_table)
    story.append(PageBreak())

    # ===== INTRODUCCIÓN =====
    story.append(Paragraph("INTRODUCCIÓN", s["h1"]))
    story.append(Paragraph(
        "Esta sección presenta el contexto general del documento, indicando su "
        "motivación, los antecedentes del proyecto y la importancia del sistema "
        "descrito para la organización destinataria. La introducción no se "
        "numera, pero hace parte de la paginación arábiga del documento.",
        s["hint"],
    ))
    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph(ph(
        "[Redacte la introducción del documento. Describa el contexto, los "
        "antecedentes y la justificación del proyecto. Se recomienda una "
        "extensión de entre media y una página.]"
    ), s["body_indent"]))
    story.append(PageBreak())

    # ===== 1. GENERALIDADES =====
    story.append(Paragraph("1.  GENERALIDADES DEL DOCUMENTO", s["h1"]))

    story.append(Paragraph("1.1  PROPÓSITO", s["h2"]))
    story.append(Paragraph(
        "Indique para qué sirve este documento y a quién va dirigido "
        "(desarrolladores, cliente, equipo de TI, auditores, entre otros).",
        s["hint"],
    ))
    story.append(Paragraph(ph("[Redactar propósito del documento]"),
                           s["body_indent"]))

    story.append(Paragraph("1.2  ALCANCE", s["h2"]))
    story.append(Paragraph(
        "Identifique el nombre del producto, lo que hará y no hará, sus "
        "beneficios y objetivos.",
        s["hint"],
    ))
    story.append(make_table([
        ["Aspecto", "Descripción"],
        ["Nombre del producto", ph("[Ejemplo: Sistema de gestión …]")],
        ["Funcionalidades incluidas", ph("[Listar funciones principales]")],
        ["Funcionalidades excluidas", ph("[Listar exclusiones explícitas]")],
        ["Beneficios esperados", ph("[Listar beneficios]")],
        ["Objetivos del software", ph("[Listar objetivos]")],
    ], [5 * cm, 9 * cm]))

    story.append(Paragraph("1.3  DEFINICIONES, ACRÓNIMOS Y ABREVIATURAS", s["h2"]))
    story.append(Paragraph(
        "Defina los términos, siglas y abreviaturas empleados en el documento.",
        s["hint"],
    ))
    story.append(make_table([
        ["Término / Sigla", "Definición"],
        [ph("[Sigla]"), ph("[Definición]")],
        [ph("[Sigla]"), ph("[Definición]")],
        [ph("[Sigla]"), ph("[Definición]")],
    ], [4 * cm, 10 * cm]))

    story.append(Paragraph("1.4  REFERENCIAS", s["h2"]))
    story.append(Paragraph(
        "Liste los documentos relacionados: estándares aplicables (IEEE 830-1998, "
        "ISO/IEC 25010, ICONTEC NTC 1486), normativa vigente (Ley 1581 de 2012 "
        "sobre protección de datos, Resolución 1995 de 1999 sobre historia "
        "clínica) y manuales internos.",
        s["hint"],
    ))
    for _ in range(3):
        story.append(Paragraph(f"-  {ph('[Referencia bibliográfica]')}",
                               s["bullet"]))

    story.append(Paragraph("1.5  VISIÓN GENERAL DEL DOCUMENTO", s["h2"]))
    story.append(Paragraph(
        "Resuma la estructura del documento indicando lo que contiene cada "
        "capítulo.",
        s["hint"],
    ))
    story.append(Paragraph(ph("[Resumen de la estructura del documento]"),
                           s["body_indent"]))
    story.append(PageBreak())

    # ===== 2. DESCRIPCIÓN GENERAL =====
    story.append(Paragraph("2.  DESCRIPCIÓN GENERAL", s["h1"]))

    story.append(Paragraph("2.1  PERSPECTIVA DEL PRODUCTO", s["h2"]))
    story.append(Paragraph(
        "Indique si el producto es nuevo, si reemplaza un sistema existente o "
        "si se integra con otros sistemas. Se recomienda incluir un diagrama "
        "de contexto.",
        s["hint"],
    ))
    story.append(Paragraph(ph("[Descripción y diagrama de contexto]"),
                           s["body_indent"]))

    story.append(Paragraph("2.2  FUNCIONES DEL PRODUCTO", s["h2"]))
    story.append(Paragraph(
        "Lista de alto nivel de las funcionalidades principales del producto.",
        s["hint"],
    ))
    for n in range(1, 6):
        story.append(Paragraph(f"-  F{n}. {ph('[Función]')}", s["bullet"]))

    story.append(Paragraph("2.3  CARACTERÍSTICAS DE LOS USUARIOS", s["h2"]))
    story.append(make_table([
        ["Tipo de usuario", "Formación", "Frecuencia", "Privilegios"],
        [ph("[Administrador]"), ph("[Técnica]"),
         ph("[Diaria]"), ph("[Totales]")],
        [ph("[Operativo]"), ph("[Básica]"),
         ph("[Diaria]"), ph("[Limitados]")],
        [ph("[Consulta]"), ph("[Básica]"),
         ph("[Esporádica]"), ph("[Solo lectura]")],
    ], [4 * cm, 3.5 * cm, 3 * cm, 3.5 * cm]))

    story.append(Paragraph("2.4  RESTRICCIONES GENERALES", s["h2"]))
    story.append(Paragraph(
        "Limitaciones que afectan el desarrollo: tecnología obligatoria, marco "
        "legal, hardware disponible, políticas internas, etc.",
        s["hint"],
    ))
    for _ in range(3):
        story.append(Paragraph(f"-  {ph('[Restricción]')}", s["bullet"]))

    story.append(Paragraph("2.5  SUPOSICIONES Y DEPENDENCIAS", s["h2"]))
    story.append(Paragraph(
        "Aspectos que se dan por ciertos y cuyas variaciones afectarían el "
        "sistema.",
        s["hint"],
    ))
    for _ in range(3):
        story.append(Paragraph(f"-  {ph('[Suposición o dependencia]')}",
                               s["bullet"]))

    story.append(Paragraph("2.6  REQUISITOS FUTUROS", s["h2"]))
    story.append(Paragraph(
        "Funcionalidades excluidas de la versión actual y proyectadas para "
        "iteraciones posteriores.",
        s["hint"],
    ))
    for _ in range(2):
        story.append(Paragraph(f"-  {ph('[Mejora futura]')}", s["bullet"]))

    story.append(PageBreak())

    # ===== 3. REQUISITOS ESPECÍFICOS =====
    story.append(Paragraph("3.  REQUISITOS ESPECÍFICOS", s["h1"]))

    story.append(Paragraph("3.1  REQUISITOS FUNCIONALES", s["h2"]))
    story.append(Paragraph(
        "Cada requisito debe ser atómico, verificable y libre de ambigüedad. "
        "Se numeran consecutivamente (RF-001, RF-002, …) y se prioriza cada "
        "uno como Alto, Medio o Bajo.",
        s["hint"],
    ))

    for n in (1, 2):
        story.append(Paragraph(
            f"3.1.{n}  RF-{n:03d}  {ph('[Nombre del requisito]')}",
            s["h3"],
        ))
        story.append(make_table([
            ["Campo", "Detalle"],
            ["Descripción", ph("[Qué hace el sistema]")],
            ["Entradas", ph("[Datos que recibe]")],
            ["Proceso", ph("[Lógica y validaciones]")],
            ["Salidas", ph("[Resultado esperado]")],
            ["Prioridad", ph("Alta / Media / Baja")],
            ["Actor(es)", ph("[Quién lo utiliza]")],
            ["Precondición", ph("[Estado previo necesario]")],
            ["Postcondición", ph("[Estado tras la ejecución]")],
        ], [4 * cm, 10 * cm]))
        story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("3.2  REQUISITOS NO FUNCIONALES", s["h2"]))
    story.append(Paragraph(
        "Se clasifican siguiendo las categorías definidas por la norma "
        "ISO/IEC 25010. Cada requisito debe ser cuantificable.",
        s["hint"],
    ))
    rnf = [
        ("3.2.1  Rendimiento", "RNF-R-01",
         "[Ej.: respuesta menor a 2 segundos para el 95% de las peticiones.]"),
        ("3.2.2  Seguridad", "RNF-S-01",
         "[Autenticación, cifrado, control de acceso, cumplimiento normativo.]"),
        ("3.2.3  Disponibilidad", "RNF-D-01",
         "[Ej.: 99% de disponibilidad en horario laboral.]"),
        ("3.2.4  Usabilidad", "RNF-U-01",
         "[Ej.: curva de aprendizaje inferior a 2 horas.]"),
        ("3.2.5  Mantenibilidad", "RNF-M-01",
         "[Ej.: código documentado y modular.]"),
        ("3.2.6  Portabilidad", "RNF-P-01",
         "[Navegadores y sistemas operativos soportados.]"),
        ("3.2.7  Escalabilidad", "RNF-E-01",
         "[Ej.: soporte para N usuarios concurrentes.]"),
    ]
    for titulo, codigo, ejemplo in rnf:
        story.append(Paragraph(titulo, s["h3"]))
        story.append(Paragraph(f"<b>{codigo}.</b>  {ph(ejemplo)}",
                               s["body_indent"]))

    story.append(Paragraph("3.3  REQUISITOS DE INTERFACES", s["h2"]))
    interfaces = [
        ("3.3.1  Interfaces de usuario",
         "Descripción de las pantallas principales, prototipos o mockups."),
        ("3.3.2  Interfaces de hardware",
         "Lectores, impresoras, escáneres, equipos especializados."),
        ("3.3.3  Interfaces de software",
         "APIs externas, bases de datos, servicios de terceros."),
        ("3.3.4  Interfaces de comunicación",
         "Protocolos (HTTPS, REST, WebSocket), puertos, redes."),
    ]
    for titulo, descripcion in interfaces:
        story.append(Paragraph(titulo, s["h3"]))
        story.append(Paragraph(descripcion, s["hint"]))
        story.append(Paragraph(ph("[Detalle]"), s["body_indent"]))

    story.append(PageBreak())

    # ===== 4. APÉNDICES =====
    story.append(Paragraph("4.  APÉNDICES", s["h1"]))

    story.append(Paragraph("4.1  GLOSARIO", s["h2"]))
    story.append(Paragraph(
        "Términos técnicos y del dominio del negocio empleados en el documento.",
        s["hint"],
    ))
    story.append(make_table([
        ["Término", "Definición"],
        [ph("[Término]"), ph("[Definición]")],
        [ph("[Término]"), ph("[Definición]")],
    ], [4 * cm, 10 * cm]))

    story.append(Paragraph("4.2  MODELO DE DATOS", s["h2"]))
    story.append(Paragraph(
        "Diagrama Entidad-Relación o listado de entidades principales con sus "
        "atributos.",
        s["hint"],
    ))
    story.append(Paragraph(ph("[Adjuntar diagrama o listado]"),
                           s["body_indent"]))

    story.append(Paragraph("4.3  DIAGRAMA DE ARQUITECTURA", s["h2"]))
    story.append(Paragraph(
        "Componentes del sistema (frontend, backend, base de datos, servicios "
        "externos) y la forma en que se comunican entre sí.",
        s["hint"],
    ))
    story.append(Paragraph(ph("[Adjuntar diagrama de arquitectura]"),
                           s["body_indent"]))

    story.append(Paragraph("4.4  CASOS DE USO", s["h2"]))
    story.append(make_table([
        ["ID", "Actor", "Acción", "Resultado"],
        ["CU-01", ph("[Actor]"), ph("[Acción]"), ph("[Resultado]")],
        ["CU-02", ph("[Actor]"), ph("[Acción]"), ph("[Resultado]")],
    ], [1.8 * cm, 3 * cm, 4.6 * cm, 4.6 * cm]))

    story.append(Paragraph("4.5  MATRIZ DE TRAZABILIDAD", s["h2"]))
    story.append(make_table([
        ["Requisito", "Caso de uso", "Módulo", "Prueba"],
        ["RF-001", "CU-01", ph("[módulo]"), ph("[prueba]")],
        ["RF-002", "CU-02", ph("[módulo]"), ph("[prueba]")],
    ], [3 * cm, 3 * cm, 4 * cm, 4 * cm]))

    story.append(Paragraph("4.6  CRONOGRAMA", s["h2"]))
    story.append(make_table([
        ["Fase", "Entregable", "Fecha"],
        [ph("[Análisis]"), ph("[ERS aprobado]"), ph("[DD/MM/AAAA]")],
        [ph("[Desarrollo]"), ph("[Build estable]"), ph("[DD/MM/AAAA]")],
        [ph("[Pruebas]"), ph("[QA aprobado]"), ph("[DD/MM/AAAA]")],
        [ph("[Despliegue]"), ph("[Sistema en producción]"), ph("[DD/MM/AAAA]")],
    ], [4.5 * cm, 6 * cm, 3.5 * cm]))

    story.append(Paragraph("4.7  PLAN DE DESPLIEGUE", s["h2"]))
    story.append(Paragraph(
        "Pasos para instalar el software en la infraestructura del cliente: "
        "requisitos previos, configuración, comandos y verificación.",
        s["hint"],
    ))
    story.append(Paragraph(ph("[Detallar los pasos de instalación]"),
                           s["body_indent"]))

    story.append(Paragraph("4.8  PLAN DE CAPACITACIÓN", s["h2"]))
    story.append(Paragraph(
        "Sesiones de entrenamiento, manuales y soporte posterior a la entrega.",
        s["hint"],
    ))
    story.append(Paragraph(ph("[Detallar el plan de capacitación]"),
                           s["body_indent"]))

    story.append(Paragraph("4.9  APROBACIÓN", s["h2"]))
    story.append(make_table([
        ["Rol", "Nombre", "Firma", "Fecha"],
        ["Autor", ph("[Nombre]"), "", ""],
        ["Revisor técnico", ph("[Nombre]"), "", ""],
        ["Aprobador (cliente)", ph("[Nombre]"), "", ""],
    ], [4 * cm, 4.5 * cm, 3 * cm, 2.5 * cm]))

    story.append(PageBreak())

    # ===== BIBLIOGRAFÍA =====
    story.append(Paragraph("BIBLIOGRAFÍA", s["h1"]))
    story.append(Paragraph(
        "Listado de fuentes consultadas, citadas según norma ICONTEC NTC 1486. "
        "Se ordena alfabéticamente por apellido del autor.",
        s["hint"],
    ))
    story.append(Spacer(1, 0.3 * cm))
    refs = [
        "INSTITUTE OF ELECTRICAL AND ELECTRONICS ENGINEERS. IEEE Recommended "
        "Practice for Software Requirements Specifications: IEEE Std 830-1998. "
        "New York: IEEE, 1998.",
        "INSTITUTO COLOMBIANO DE NORMAS TÉCNICAS Y CERTIFICACIÓN. Documentación. "
        "Presentación de tesis, trabajos de grado y otros trabajos de "
        "investigación: NTC 1486. Bogotá D.C.: ICONTEC, 2008.",
        "INTERNATIONAL ORGANIZATION FOR STANDARDIZATION. ISO/IEC 25010:2011 "
        "Systems and software engineering — Systems and software Quality "
        "Requirements and Evaluation (SQuaRE). Ginebra: ISO, 2011.",
    ]
    for r in refs:
        story.append(Paragraph(r, ParagraphStyle(
            "Ref", parent=s["body"], leftIndent=24, firstLineIndent=-24,
            spaceAfter=10,
        )))

    doc.build(
        story,
        onFirstPage=cover_blank,
        onLaterPages=page_with_number,
    )
    print(f"OK -> {out_path}")


if __name__ == "__main__":
    main()
