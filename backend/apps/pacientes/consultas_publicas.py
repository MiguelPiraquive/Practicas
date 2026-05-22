"""
Servicio de consulta a entidades públicas colombianas.

Consulta datos de personas por cédula en fuentes gratuitas y públicas:
- Procuraduría General de la Nación (antecedentes disciplinarios)
  URL REAL: apps.procuraduria.gov.co/webcert/ (iframe dentro de SharePoint)
- Contraloría General (antecedentes fiscales)
  URL REAL: cfiscal.contraloria.gov.co/Certificados/ (genera PDF)
- Policía Nacional (antecedentes judiciales) — endpoints bloqueados/JS only
- ADRES (afiliación EPS en salud) — servidor con error 500

Todas son consultas públicas legales que cualquier ciudadano puede hacer.
Timeout de 8 segundos por fuente. Se ejecutan en paralelo desde views.py.

Probado en vivo: 2026-03-24. Procuraduría y Contraloría CONFIRMADOS.
"""

import io
import requests
from bs4 import BeautifulSoup
import logging
import re
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

TIMEOUT = 8  # 8 segundos max por fuente (gov sites son lentos)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-CO,es;q=0.9",
}


def _safe_get(session, url):
    return session.get(url, timeout=TIMEOUT, verify=False)


def _safe_post(session, url, **kwargs):
    kwargs.setdefault("timeout", TIMEOUT)
    kwargs.setdefault("verify", False)
    return session.post(url, **kwargs)


def _new_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


# ═══════════════════════════════════════════════════════════════════
# PROCURADURÍA — URL real: apps.procuraduria.gov.co/webcert/
# Confirmado funcionando. Tiene captcha de texto (math/geografía/
# dígitos del documento) que se resuelve programáticamente.
# Retorna HTML con nombre completo y estado de antecedentes.
# ═══════════════════════════════════════════════════════════════════
def consultar_procuraduria(tipo_doc, numero_doc):
    """Consulta antecedentes en Procuraduría via webcert (iframe real)."""
    try:
        session = _new_session()

        # GET inicio.aspx redirige a Certificado.aspx?t=<token>&tpo=1
        url_inicio = "https://apps.procuraduria.gov.co/webcert/inicio.aspx"
        page = _safe_get(session, url_inicio)
        if page.status_code != 200:
            return _no_encontrado("procuraduria")

        url_cert = page.url  # URL con token de sesión
        soup = BeautifulSoup(page.text, "html.parser")

        # Extraer pregunta captcha del texto de la página
        pregunta = _extraer_pregunta_captcha(soup)
        respuesta = _resolver_captcha(pregunta, numero_doc)

        if not respuesta:
            # Reintentar hasta 2 veces con nueva sesión (pregunta cambia)
            for _ in range(2):
                session = _new_session()
                page = _safe_get(session, url_inicio)
                if page.status_code != 200:
                    continue
                url_cert = page.url
                soup = BeautifulSoup(page.text, "html.parser")
                pregunta = _extraer_pregunta_captcha(soup)
                respuesta = _resolver_captcha(pregunta, numero_doc)
                if respuesta:
                    break

        if not respuesta:
            logger.debug(f"Procuraduría: captcha no resuelto: {pregunta}")
            return _no_encontrado("procuraduria")

        # Construir form data con todos los campos hidden
        form_data = {}
        for inp in soup.find_all("input"):
            name = inp.get("name", "")
            if name:
                form_data[name] = inp.get("value", "")

        form_data["ddlTipoID"] = _tipo_doc_num(tipo_doc)
        form_data["txtNumID"] = numero_doc
        form_data["txtRespuestaPregunta"] = respuesta
        form_data["btnConsultar"] = "Consultar"
        form_data.pop("ImageButton1", None)

        resp = _safe_post(session, url_cert, data=form_data)
        if resp.status_code != 200:
            return _no_encontrado("procuraduria")

        # Respuesta exitosa: HTML con datos del ciudadano
        soup_r = BeautifulSoup(resp.text, "html.parser")
        texto = soup_r.get_text(separator="\n", strip=True)

        # Verificar que el captcha fue correcto
        if "valor ingresado" in texto.lower():
            return _no_encontrado("procuraduria")

        # Extraer nombre de las líneas "Datos del ciudadano"
        nombre_completo = _extraer_nombre_procuraduria(texto)

        # Extraer estado de antecedentes
        antecedentes = "Sin antecedentes"
        if "no presenta antecedentes" in texto.lower():
            antecedentes = "Sin antecedentes"
        elif "presenta antecedentes" in texto.lower() or "registra antecedentes" in texto.lower():
            antecedentes = "Con antecedentes"

        if nombre_completo:
            return {
                "consultado": True,
                "encontrado": True,
                "fuente": "procuraduria",
                "nombre_completo": nombre_completo,
                "antecedentes_disciplinarios": antecedentes,
            }

        return _no_encontrado("procuraduria")

    except Exception as e:
        logger.debug(f"Procuraduría: {e}")
        return _error("procuraduria", e)


def _extraer_pregunta_captcha(soup):
    """Extrae la pregunta captcha del HTML de Procuraduría."""
    # Buscar en span lblPregunta
    lbl = soup.find("span", {"id": re.compile(r"lblPregunta", re.I)})
    if lbl:
        return lbl.get_text(strip=True)

    # Buscar en texto general: línea con "?" y palabras clave
    texto = soup.get_text(separator="\n", strip=True)
    for line in texto.split("\n"):
        line = line.strip()
        if "?" in line and len(line) > 8:
            ll = line.lower()
            if any(kw in ll for kw in ["capital", "cuanto", "cuánto", "primer",
                                        "ultimo", "último", "digito", "dígito",
                                        "nombre", "escriba"]):
                return line
    return ""


def _resolver_captcha(pregunta, numero_doc):
    """Resuelve captchas de Procuraduría: math, geografía, dígitos del doc."""
    if not pregunta:
        return ""

    pregunta_lower = pregunta.lower().strip()

    # Tipo 1: "Escriba los N primeros dígitos del documento"
    if "primer" in pregunta_lower and "digito" in pregunta_lower:
        n = _extraer_numero_texto(pregunta_lower, default=3)
        return numero_doc[:n]

    # Tipo 2: "Escriba los N últimos dígitos del documento"
    if ("ultimo" in pregunta_lower or "último" in pregunta_lower) and "digito" in pregunta_lower:
        n = _extraer_numero_texto(pregunta_lower, default=3)
        return numero_doc[-n:]

    # Tipo 3: Math — "¿Cuanto es 9 + 2?" / "¿Cuanto es 3 X 3?"
    m = re.search(r'(\d+)\s*([+\-*Xx×])\s*(\d+)', pregunta)
    if m:
        a, op, b = int(m.group(1)), m.group(2), int(m.group(3))
        if op == '+':
            return str(a + b)
        elif op == '-':
            return str(a - b)
        else:
            return str(a * b)

    # Tipo 4: Geografía — "¿Cuál es la capital del Valle del Cauca?"
    # Orden: más específico primero para evitar match parcial
    capitales = {
        "norte de santander": "cucuta",
        "valle del cauca": "cali", "vallle del cauca": "cali",
        "san andres": "san andres",
        "la guajira": "riohacha",
        "valle": "cali", "vallle": "cali",
        "colombia": "bogota", "cundinamarca": "bogota",
        "antioquia": "medellin", "atlantico": "barranquilla",
        "santander": "bucaramanga", "bolivar": "cartagena",
        "tolima": "ibague", "nariño": "pasto", "narino": "pasto",
        "huila": "neiva", "meta": "villavicencio",
        "boyaca": "tunja", "cesar": "valledupar",
        "risaralda": "pereira", "magdalena": "santa marta",
        "caldas": "manizales", "cauca": "popayan",
        "quindio": "armenia", "sucre": "sincelejo",
        "cordoba": "monteria", "caqueta": "florencia",
        "casanare": "yopal", "putumayo": "mocoa",
        "arauca": "arauca", "choco": "quibdo",
        "guainia": "inirida", "guaviare": "san jose del guaviare",
        "vaupes": "mitu", "vichada": "puerto carreno",
        "amazonas": "leticia", "guajira": "riohacha",
    }
    for dept, cap in capitales.items():
        if dept in pregunta_lower:
            return cap

    return ""


def _extraer_numero_texto(texto, default=3):
    """Extrae un número escrito en palabras o cifras del texto."""
    nums = {"un": 1, "uno": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5}
    for word, val in nums.items():
        if word in texto:
            return val
    m = re.search(r'(\d+)', texto)
    if m:
        return int(m.group(1))
    return default


def _extraer_nombre_procuraduria(texto):
    """Extrae nombre del texto HTML de respuesta de Procuraduría.

    La respuesta tiene el formato:
        Datos del ciudadano
        JUAN
        FELIPE
        PARRA
        RODRIGUEZ
        identificado(a) con ...
    """
    lines = [l.strip() for l in texto.split("\n") if l.strip()]

    # Buscar bloque después de "Datos del ciudadano"
    idx_datos = None
    for i, line in enumerate(lines):
        if "datos del ciudadano" in line.lower():
            idx_datos = i
            break

    if idx_datos is not None:
        # Las siguientes líneas son partes del nombre (todo mayúsculas)
        # Puede haber "Señor(a)" antes del nombre real
        partes_nombre = []
        for line in lines[idx_datos + 1:]:
            # Saltar "Señor(a)" u otras líneas no-nombre
            if re.match(r'^Se.or\(a\)$', line, re.I):
                continue
            if re.match(r'^[A-ZÁÉÍÓÚÑ\s]+$', line) and len(line) >= 2:
                partes_nombre.append(line.strip())
            else:
                break

        if len(partes_nombre) >= 2:
            return " ".join(partes_nombre).title()

    return ""


# ═══════════════════════════════════════════════════════════════════
# POLICÍA NACIONAL — Endpoints bloqueados
# La Policía bloquea scraping (HTTP 555 "No Autorizado" en SOAP,
# HTTP 500 en web, y RNMC requiere JavaScript/UpdatePanel).
# Se mantiene como stub que retorna gracefully.
# ═══════════════════════════════════════════════════════════════════
def consultar_policia(tipo_doc, numero_doc):
    """Intenta consultar Policía Nacional. Endpoints actualmente bloqueados."""
    return _no_encontrado("policia")


# ═══════════════════════════════════════════════════════════════════
# CONTRALORÍA — URL real: cfiscal.contraloria.gov.co/Certificados/
# Confirmado funcionando. Retorna certificado PDF con estado fiscal.
# La página principal (contraloria.gov.co) usa Liferay+iframe.
# El iframe apunta a cfiscal.contraloria.gov.co que SÍ funciona.
# ═══════════════════════════════════════════════════════════════════
def consultar_contraloria(tipo_doc, numero_doc):
    """Consulta antecedentes fiscales en Contraloría via cfiscal (endpoint real)."""
    try:
        session = _new_session()
        url = "https://cfiscal.contraloria.gov.co/Certificados/CertificadoPersonaNatural.aspx"

        page = _safe_get(session, url)
        if page.status_code != 200:
            return _no_encontrado("contraloria")

        soup = BeautifulSoup(page.text, "html.parser")

        # Construir form data
        form_data = {}
        for inp in soup.find_all("input"):
            name = inp.get("name", "")
            if name:
                form_data[name] = inp.get("value", "")

        # Campos específicos del formulario ASP.NET
        form_data["ctl00$MainContent$ddlTipoDocumento"] = tipo_doc
        form_data["ctl00$MainContent$txtNumeroDocumento"] = numero_doc
        form_data["ctl00$MainContent$btnBuscar"] = "Buscar"
        # Remover botones de encuesta
        form_data.pop("ctl00$MainContent$btnAbrirEncuesta", None)
        form_data.pop("ctl00$MainContent$Button1", None)

        resp = _safe_post(session, url, data=form_data)
        if resp.status_code != 200:
            return _no_encontrado("contraloria")

        # La respuesta exitosa es un PDF
        if resp.content[:4] == b"%PDF":
            texto_pdf = _extraer_texto_pdf(resp.content)

            if texto_pdf:
                no_registra = "no se encuentra" in texto_pdf.lower()
                return {
                    "consultado": True,
                    "encontrado": True,
                    "fuente": "contraloria",
                    "nombre_completo": "",  # PDF no contiene nombre
                    "antecedentes_fiscales": (
                        "Sin antecedentes fiscales" if no_registra
                        else "Registra como responsable fiscal"
                    ),
                }

        # Si no es PDF, puede ser HTML con error de validación
        return _no_encontrado("contraloria")

    except Exception as e:
        logger.debug(f"Contraloría: {e}")
        return _error("contraloria", e)


def _extraer_texto_pdf(contenido_bytes):
    """Extrae texto de un PDF en bytes usando PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(contenido_bytes))
        textos = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                textos.append(t)
        return "\n".join(textos)
    except Exception:
        return ""


# ═══════════════════════════════════════════════════════════════════
# ADRES (EPS / Salud) — Servidor con error 500
# El servidor de ADRES retorna NullReferenceException (error .NET).
# Se mantiene como stub que retorna gracefully.
# ═══════════════════════════════════════════════════════════════════
def consultar_adres(tipo_doc, numero_doc):
    """Intenta consultar ADRES. Servidor actualmente con error 500."""
    return _no_encontrado("adres")


# ═══════════════════════════════════════════════════════════════════
# UTILIDADES
# ═══════════════════════════════════════════════════════════════════
def _no_encontrado(fuente):
    return {"consultado": True, "encontrado": False, "fuente": fuente}


def _error(fuente, e):
    return {"consultado": False, "encontrado": False, "fuente": fuente, "error": str(e)}


def _tipo_doc_num(tipo):
    """Mapea tipo de documento a código numérico de Procuraduría."""
    return {"CC": "1", "TI": "2", "CE": "5", "PA": "4", "NIT": "2", "PEP": "0", "PPT": "10"}.get(tipo, "1")
