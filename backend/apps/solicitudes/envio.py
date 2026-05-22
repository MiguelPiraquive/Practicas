"""
Envío de la HC al paciente por correo electrónico o WhatsApp.

- CORREO: usa el backend de email configurado en Django.
          Si no hay SMTP configurado, usa el backend de consola (imprime
          el correo en la terminal del servidor) para que se pueda probar
          el flujo completo sin credenciales.

- WHATSAPP: integración con Twilio (opcional). Si no está configurado,
            registra el envío como simulado.
"""

import logging
import os
from typing import Tuple

from django.conf import settings
from django.core.mail import EmailMessage

logger = logging.getLogger(__name__)


def enviar_por_correo(
    destinatario: str,
    asunto: str,
    cuerpo: str,
    archivo_path: str,
    nombre_archivo: str = "historia_clinica.pdf",
) -> Tuple[bool, str]:
    """
    Envía la HC por correo electrónico.

    Returns:
        (ok, mensaje)
    """
    if not destinatario or "@" not in destinatario:
        return False, f"Destinatario de correo inválido: '{destinatario}'"

    if not os.path.exists(archivo_path):
        return False, f"El archivo PDF no existe en disco: {archivo_path}"

    try:
        email = EmailMessage(
            subject=asunto,
            body=cuerpo,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "ventanilla@junical.local"),
            to=[destinatario],
        )
        email.attach_file(archivo_path)
        email.send(fail_silently=False)
        return True, f"Correo enviado a {destinatario}."
    except Exception as e:
        logger.exception("Error enviando correo")
        return False, f"Error enviando correo: {e}"


def enviar_por_whatsapp(
    numero: str,
    mensaje: str,
    archivo_url: str = "",
    archivo_path: str = "",
    nombre_archivo: str = "historia_clinica.pdf",
) -> Tuple[bool, str]:
    """
    Envía la HC por WhatsApp.

    Estrategia de proveedores (en orden de preferencia):
        1) OpenWA local (https://github.com/rmyndharis/OpenWA) — si está
           configurado en settings. Permite adjuntar el PDF directamente.
        2) Twilio — requiere URL pública del archivo.
        3) SIMULADO — solo registra, para entornos de desarrollo sin
           credenciales.

    Returns:
        (ok, mensaje)
    """
    numero = (numero or "").strip()
    if not numero:
        return False, "Número de WhatsApp vacío."

    # --- Proveedor 1: OpenWA --------------------------------------------------
    from . import openwa  # import local para evitar ciclos

    if openwa.is_enabled():
        return openwa.enviar_mensaje(
            numero=numero,
            mensaje=mensaje,
            archivo_url=archivo_url,
            archivo_path=archivo_path,
            nombre_archivo=nombre_archivo,
        )

    # --- Proveedor 2: Twilio --------------------------------------------------
    # Normalizar a formato internacional Colombia si solo entró el celular.
    numero_intl = numero
    if numero_intl.startswith("3") and len(numero_intl) == 10:
        numero_intl = "+57" + numero_intl
    elif not numero_intl.startswith("+"):
        numero_intl = "+" + numero_intl

    sid = getattr(settings, "TWILIO_ACCOUNT_SID", "").strip()
    token = getattr(settings, "TWILIO_AUTH_TOKEN", "").strip()
    from_wa = getattr(settings, "TWILIO_WHATSAPP_FROM", "").strip()

    if not (sid and token and from_wa):
        # Modo simulación.
        return True, (
            f"WhatsApp SIMULADO a {numero_intl}. "
            f"Configure OpenWA (OPENWA_BASE_URL/API_KEY/SESSION_ID) o "
            f"Twilio en .env para envíos reales."
        )

    try:
        from twilio.rest import Client  # type: ignore
    except ImportError:
        return False, "Twilio no instalado. Ejecute: pip install twilio"

    try:
        client = Client(sid, token)
        kwargs = {
            "from_": f"whatsapp:{from_wa}",
            "to": f"whatsapp:{numero_intl}",
            "body": mensaje,
        }
        if archivo_url:
            kwargs["media_url"] = [archivo_url]
        msg = client.messages.create(**kwargs)
        return True, f"WhatsApp enviado a {numero_intl} (SID: {msg.sid})."
    except Exception as e:
        logger.exception("Error enviando WhatsApp")
        return False, f"Error enviando WhatsApp: {e}"
