"""
Cliente HTTP para OpenWA — WhatsApp API Gateway open-source.

Repo: https://github.com/rmyndharis/OpenWA

Configuración mínima requerida en `.env`:

    OPENWA_BASE_URL=http://localhost:2785/api
    OPENWA_API_KEY=...

Opcional (override manual, NORMALMENTE NO se usa):
    OPENWA_SESSION_ID=...   # solo si quieres forzar una sesión específica

Comportamiento:
- Si `OPENWA_SESSION_ID` está definido, se usa esa sesión fija.
- Si NO está definido (recomendado), el cliente consulta automáticamente a OpenWA
  qué sesión está en estado `ready`/`connected` y la usa. Esto permite que la
  clínica re-vincule un nuevo celular en el Dashboard de OpenWA sin tocar el
  código ni reiniciar Django.
- El ID detectado se cachea por 30 segundos en memoria para no martillar la API.

Cómo levantar OpenWA (referencia rápida):
    git clone https://github.com/rmyndharis/OpenWA.git
    cd OpenWA
    docker compose -f docker-compose.dev.yml up -d
    # Dashboard: http://localhost:2886
"""

from __future__ import annotations

import base64
import logging
import os
import threading
import time
from typing import Optional, Tuple

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------- caché


_CACHE_TTL_SECONDS = 30
_cache_lock = threading.Lock()
_cached_session_id: Optional[str] = None
_cached_at: float = 0.0


def _cache_get() -> Optional[str]:
    with _cache_lock:
        if _cached_session_id and (time.time() - _cached_at) < _CACHE_TTL_SECONDS:
            return _cached_session_id
    return None


def _cache_set(sid: str) -> None:
    global _cached_session_id, _cached_at
    with _cache_lock:
        _cached_session_id = sid
        _cached_at = time.time()


def _cache_clear() -> None:
    global _cached_session_id, _cached_at
    with _cache_lock:
        _cached_session_id = None
        _cached_at = 0.0


# --------------------------------------------------------------------- helpers


# Estados que consideramos "lista para enviar"
_READY_STATES = {"ready", "connected", "authenticated", "open"}


def _config() -> Tuple[str, str, str]:
    base_url = getattr(settings, "OPENWA_BASE_URL", "").rstrip("/")
    api_key = getattr(settings, "OPENWA_API_KEY", "").strip()
    session_override = getattr(settings, "OPENWA_SESSION_ID", "").strip()
    return base_url, api_key, session_override


def _headers(api_key: str) -> dict:
    return {"X-API-Key": api_key, "Accept": "application/json"}


def _listar_sesiones(base_url: str, api_key: str, timeout: int = 5) -> list:
    """Devuelve la lista cruda de sesiones desde OpenWA."""
    resp = requests.get(
        f"{base_url}/sessions", headers=_headers(api_key), timeout=timeout
    )
    resp.raise_for_status()
    data = resp.json() if resp.content else []
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("data", "sessions", "items", "results"):
            if isinstance(data.get(key), list):
                return data[key]
    return []


def _descubrir_sesion_activa(base_url: str, api_key: str, timeout: int = 5) -> str:
    """Devuelve el ID de la primera sesión ready/connected, o ''."""
    try:
        sesiones = _listar_sesiones(base_url, api_key, timeout=timeout)
    except Exception as e:
        logger.warning("OpenWA: error listando sesiones: %s", e)
        return ""

    for s in sesiones:
        status = str(s.get("status") or s.get("state") or "").lower()
        if status in _READY_STATES:
            return str(s.get("id") or s.get("sessionId") or "")
    return ""


def _resolver_session_id(force_refresh: bool = False) -> Tuple[str, str]:
    """
    Resuelve el session_id a usar.

    Returns:
        (session_id, fuente)  fuente ∈ {"override", "auto", "cache", ""}
    """
    base_url, api_key, override = _config()
    if not (base_url and api_key):
        return "", ""

    if override:
        return override, "override"

    if not force_refresh:
        cached = _cache_get()
        if cached:
            return cached, "cache"

    sid = _descubrir_sesion_activa(base_url, api_key)
    if sid:
        _cache_set(sid)
        return sid, "auto"

    _cache_clear()
    return "", ""


def _normalizar_chat_id(numero: str) -> str:
    """Convierte un número marcado por la usuaria al formato chatId de WhatsApp."""
    numero = (numero or "").strip()
    if not numero:
        return ""
    limpio = "".join(ch for ch in numero if ch.isdigit())
    if not limpio:
        return ""
    # Si tiene 10 dígitos y empieza por 3, asumir Colombia (+57)
    if len(limpio) == 10 and limpio.startswith("3"):
        limpio = "57" + limpio
    return f"{limpio}@c.us"


def _url_para_openwa(url: str) -> str:
    """
    Convierte URLs apuntando a localhost/127.0.0.1 en `host.docker.internal`
    para que el contenedor de OpenWA pueda descargar el archivo desde el host
    donde corre Django.
    """
    if not url:
        return url
    return (
        url.replace("://localhost:", "://host.docker.internal:")
           .replace("://127.0.0.1:", "://host.docker.internal:")
    )


# --------------------------------------------------------------------- API pública


def is_enabled() -> bool:
    """OpenWA está habilitado si tenemos base_url + api_key configurados."""
    base, key, _ = _config()
    return bool(base and key)


def estado_sesion(timeout: int = 5) -> Tuple[bool, dict]:
    """Diagnóstico: estado de la sesión que el sistema usaría AHORA."""
    base_url, api_key, override = _config()
    if not (base_url and api_key):
        return False, {
            "configurado": False,
            "mensaje": "Falta OPENWA_BASE_URL u OPENWA_API_KEY en .env",
        }

    try:
        sesiones = _listar_sesiones(base_url, api_key, timeout=timeout)
    except Exception as e:
        return False, {
            "configurado": True,
            "alcanzable": False,
            "mensaje": f"No se pudo conectar con OpenWA ({base_url}): {e}",
        }

    sid, fuente = _resolver_session_id(force_refresh=True)
    activa: Optional[dict] = None
    for s in sesiones:
        if str(s.get("id") or s.get("sessionId")) == sid:
            activa = s
            break

    listo = bool(
        sid and activa and str(activa.get("status", "")).lower() in _READY_STATES
    )
    return listo, {
        "configurado": True,
        "alcanzable": True,
        "listo": listo,
        "session_id": sid,
        "fuente_session_id": fuente,
        "override_manual": bool(override),
        "sesion_activa": activa,
        "total_sesiones": len(sesiones),
        "sesiones": [
            {
                "id": s.get("id") or s.get("sessionId"),
                "name": s.get("name"),
                "status": s.get("status") or s.get("state"),
                "phone": s.get("phone"),
            }
            for s in sesiones
        ],
    }


def refrescar_sesion() -> Tuple[str, str]:
    """Fuerza una re-detección de la sesión activa, invalidando el caché."""
    _cache_clear()
    return _resolver_session_id(force_refresh=True)


def enviar_mensaje(
    numero: str,
    mensaje: str,
    archivo_path: str = "",
    archivo_url: str = "",
    nombre_archivo: str = "historia_clinica.pdf",
    timeout: int = 60,
) -> Tuple[bool, str]:
    """
    Envía un mensaje de texto y opcionalmente un PDF por WhatsApp vía OpenWA.

    Estrategia para el archivo (en orden):
      1) `archivo_url` (recomendado): OpenWA descarga el PDF directamente.
         Evita el límite de payload (~1MB) y es mucho más eficiente.
         Si la URL apunta a localhost, se reescribe a host.docker.internal.
      2) `archivo_path` (fallback): se envía en base64 inline.

    Auto-descubre la sesión activa; si la sesión cacheada quedó stale, refresca
    y reintenta una vez.
    """
    base_url, api_key, _override = _config()
    if not (base_url and api_key):
        return False, (
            "OpenWA no está configurado. Defina OPENWA_BASE_URL y OPENWA_API_KEY en .env."
        )

    chat_id = _normalizar_chat_id(numero)
    if not chat_id:
        return False, f"Número de WhatsApp inválido: '{numero}'"

    session_id, fuente = _resolver_session_id()
    if not session_id:
        return False, (
            "No hay ninguna sesión de WhatsApp conectada en OpenWA. "
            "Abra el Dashboard (http://localhost:2886) y vincule un celular escaneando el QR."
        )

    headers = _headers(api_key)
    enviado_texto = False
    enviado_archivo = False
    detalles: list = [f"Sesión: {session_id[:8]}… ({fuente})"]

    def _post(path: str, payload: dict, sid: str) -> requests.Response:
        url = f"{base_url}/sessions/{sid}/messages/{path}"
        return requests.post(url, json=payload, headers=headers, timeout=timeout)

    def _es_session_invalida(resp: requests.Response) -> bool:
        if resp.status_code in (400, 404):
            try:
                msg = (resp.json().get("message") or "").lower()
            except Exception:
                msg = (resp.text or "").lower()
            return "session" in msg and (
                "not" in msg or "invalid" in msg or "active" in msg
            )
        return False

    def _enviar(path: str, payload: dict):
        nonlocal session_id
        resp = _post(path, payload, session_id)
        if _es_session_invalida(resp):
            _cache_clear()
            new_sid, new_fuente = _resolver_session_id(force_refresh=True)
            if new_sid and new_sid != session_id:
                session_id = new_sid
                detalles.append(f"Sesión refrescada: {new_sid[:8]}… ({new_fuente})")
                resp = _post(path, payload, session_id)
        resp.raise_for_status()

    # 1) PDF como documento — preferir URL (sin límite de tamaño)
    if archivo_url:
        try:
            url_final = _url_para_openwa(archivo_url)
            _enviar(
                "send-document",
                {
                    "chatId": chat_id,
                    "url": url_final,
                    "mimetype": "application/pdf",
                    "filename": nombre_archivo,
                    "caption": mensaje,
                },
            )
            enviado_archivo = True
            detalles.append(f"PDF adjuntado por URL ({nombre_archivo}).")
        except Exception as e:
            logger.exception("OpenWA: error enviando archivo por URL")
            detalles.append(f"No se pudo adjuntar PDF por URL: {e}")

    # 1b) Fallback: si no hubo URL o falló, intentar con base64 inline
    if not enviado_archivo and archivo_path and os.path.exists(archivo_path):
        try:
            with open(archivo_path, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("ascii")
            _enviar(
                "send-document",
                {
                    "chatId": chat_id,
                    "base64": b64,
                    "mimetype": "application/pdf",
                    "filename": nombre_archivo,
                    "caption": mensaje,
                },
            )
            enviado_archivo = True
            detalles.append(f"PDF adjuntado en base64 ({nombre_archivo}).")
        except Exception as e:
            logger.exception("OpenWA: error enviando archivo en base64")
            detalles.append(f"No se pudo adjuntar el PDF: {e}")

    # 2) Si no se envió como caption del archivo, mandar el mensaje aparte
    if not enviado_archivo and mensaje:
        try:
            _enviar("send-text", {"chatId": chat_id, "text": mensaje})
            enviado_texto = True
            detalles.append("Mensaje de texto enviado.")
        except Exception as e:
            logger.exception("OpenWA: error enviando texto")
            return False, f"Error enviando WhatsApp: {e}. " + " ".join(detalles)

    if not (enviado_archivo or enviado_texto):
        return False, "No se envió ningún mensaje. " + " ".join(detalles)

    return True, f"WhatsApp enviado a {numero} vía OpenWA. " + " ".join(detalles)
