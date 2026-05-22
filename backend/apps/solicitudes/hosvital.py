"""
Cliente para la API de Hosvital — Sistema de Información Hospitalaria.

Devuelve el PDF de la Historia Clínica de un paciente, filtrado por
rango de fechas y por tipo de documento solicitado.

Modos de operación:
    1. PRODUCCIÓN  → settings.HOSVITAL_API_URL + HOSVITAL_API_TOKEN definidos.
                     Hace una petición HTTP real al endpoint configurado.

    2. SIMULACIÓN  → Si no hay credenciales, genera un PDF de demostración
                     con los datos de la solicitud. Esto permite presentar
                     y probar el flujo aunque la clínica todavía no haya
                     habilitado las credenciales reales.

Para integrar la API real, el área de sistemas de la clínica debe entregar:
    - URL del endpoint que devuelve el PDF de la HC.
    - Token o credenciales de autenticación.
    - Documentación de los parámetros aceptados (cédula, fechas, tipo).
    - Formato exacto de la respuesta (PDF binario, JSON con base64, etc.).
"""

import io
import logging
from datetime import date
from typing import Tuple, Optional

import requests as http_requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


# Mapeo de los códigos internos del sistema a los códigos que esperaría
# Hosvital. AJUSTAR cuando se tenga la documentación real de la API.
TIPO_DOCUMENTO_HOSVITAL = {
    "EPICRISIS": "EPI",
    "HC_COMPLETA": "HCC",
    "RESUMEN": "RES",
    "EXAMENES": "EXA",
    "LABORATORIO": "LAB",
    "IMAGENES": "IMG",
    "CERT_MEDICO": "CER",
    "INCAPACIDAD": "INC",
    "URGENCIAS": "URG",
    "OTRO": "OTR",
}


def _hosvital_configurado() -> bool:
    url = getattr(settings, "HOSVITAL_API_URL", "").strip()
    token = getattr(settings, "HOSVITAL_API_TOKEN", "").strip()
    return bool(url and token)


def descargar_historia_clinica(
    tipo_documento_paciente: str,
    numero_documento_paciente: str,
    tipo_hc: str,
    fecha_desde: Optional[date],
    fecha_hasta: Optional[date],
    nombre_paciente: str = "",
) -> Tuple[bytes, str]:
    """
    Descarga el PDF de la HC desde Hosvital.

    Args:
        tipo_documento_paciente:  CC, TI, CE, PA, RC, PPT
        numero_documento_paciente: Cédula o documento del paciente.
        tipo_hc:                   EPICRISIS / HC_COMPLETA / EXAMENES / etc.
        fecha_desde:               Fecha inicial del rango de atenciones.
        fecha_hasta:               Fecha final (None = hasta hoy).
        nombre_paciente:           Para el PDF de simulación.

    Returns:
        (pdf_bytes, mensaje)  - bytes del PDF y un mensaje descriptivo.

    Raises:
        RuntimeError si la API real responde con error.
    """
    if _hosvital_configurado():
        return _descargar_real(
            tipo_documento_paciente,
            numero_documento_paciente,
            tipo_hc,
            fecha_desde,
            fecha_hasta,
        )

    # Modo simulación → genera PDF de demostración.
    return _generar_pdf_simulado(
        tipo_documento_paciente,
        numero_documento_paciente,
        tipo_hc,
        fecha_desde,
        fecha_hasta,
        nombre_paciente,
    )


def _descargar_real(
    tipo_doc: str,
    numero_doc: str,
    tipo_hc: str,
    fecha_desde: Optional[date],
    fecha_hasta: Optional[date],
) -> Tuple[bytes, str]:
    """Llamada HTTP real a Hosvital."""
    url = settings.HOSVITAL_API_URL.rstrip("/") + "/historia-clinica"
    token = settings.HOSVITAL_API_TOKEN

    payload = {
        "tipo_documento": tipo_doc,
        "numero_documento": numero_doc,
        "tipo_hc": TIPO_DOCUMENTO_HOSVITAL.get(tipo_hc, tipo_hc),
        "fecha_desde": fecha_desde.isoformat() if fecha_desde else None,
        "fecha_hasta": fecha_hasta.isoformat() if fecha_hasta else None,
    }

    try:
        resp = http_requests.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/pdf",
            },
            timeout=30,
        )
    except http_requests.RequestException as e:
        raise RuntimeError(f"No se pudo conectar con Hosvital: {e}")

    if resp.status_code != 200:
        raise RuntimeError(
            f"Hosvital respondió con código {resp.status_code}: {resp.text[:200]}"
        )

    if not resp.content:
        raise RuntimeError("Hosvital devolvió un PDF vacío.")

    return resp.content, "PDF recibido desde Hosvital correctamente."


def _generar_pdf_simulado(
    tipo_doc: str,
    numero_doc: str,
    tipo_hc: str,
    fecha_desde: Optional[date],
    fecha_hasta: Optional[date],
    nombre_paciente: str,
) -> Tuple[bytes, str]:
    """
    Genera un PDF mínimo (válido) con la información de la solicitud.
    Se usa cuando todavía no hay credenciales de Hosvital configuradas.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except ImportError:
        # Fallback: PDF mínimo válido construido a mano si reportlab no está
        return _pdf_minimo(numero_doc, tipo_hc), (
            "PDF de simulación generado (reportlab no instalado)."
        )

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 60, "CLÍNICA JUNICAL")
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 80, "Historia Clínica — DOCUMENTO DE SIMULACIÓN")

    c.line(50, height - 90, width - 50, height - 90)

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 120, "Datos del paciente")
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 140, f"Nombre: {nombre_paciente or 'SIN IDENTIFICAR'}")
    c.drawString(50, height - 160, f"Documento: {tipo_doc} {numero_doc}")

    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 200, "Detalle de la historia")
    c.setFont("Helvetica", 11)
    c.drawString(50, height - 220, f"Tipo de documento solicitado: {tipo_hc}")
    desde_txt = fecha_desde.strftime("%d/%m/%Y") if fecha_desde else "—"
    hasta_txt = fecha_hasta.strftime("%d/%m/%Y") if fecha_hasta else "Hasta la fecha"
    c.drawString(50, height - 240, f"Atenciones desde: {desde_txt}")
    c.drawString(50, height - 260, f"Atenciones hasta: {hasta_txt}")
    c.drawString(50, height - 280, f"Generado: {timezone.now().strftime('%d/%m/%Y %H:%M')}")

    c.line(50, height - 310, width - 50, height - 310)

    c.setFont("Helvetica-Oblique", 10)
    msg = (
        "Este es un documento de simulación generado por el sistema de ventanilla."
    )
    c.drawString(50, height - 335, msg)
    msg2 = (
        "Cuando la clínica habilite la API de Hosvital, este PDF será reemplazado"
    )
    c.drawString(50, height - 350, msg2)
    c.drawString(50, height - 365, "por la historia clínica real del paciente.")

    c.showPage()
    c.save()

    return buf.getvalue(), (
        "PDF de SIMULACIÓN generado. Configure HOSVITAL_API_URL y "
        "HOSVITAL_API_TOKEN en .env para usar la API real."
    )


def _pdf_minimo(numero_doc: str, tipo_hc: str) -> bytes:
    """PDF mínimo válido construido manualmente (fallback)."""
    contenido = f"Historia Clinica - Doc {numero_doc} - {tipo_hc}"
    pdf = (
        b"%PDF-1.4\n"
        b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length 80>>stream\nBT /F1 14 Tf 50 700 Td ("
        + contenido.encode("latin-1", errors="replace")
        + b") Tj ET\nendstream endobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"xref\n0 6\n0000000000 65535 f\n"
        b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n0\n%%EOF\n"
    )
    return pdf
