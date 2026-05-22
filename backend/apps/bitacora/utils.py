from .models import LogCambio


def registrar_log(usuario, accion, modelo, registro_id, detalle=""):
    LogCambio.objects.create(
        usuario=usuario,
        accion=accion,
        modelo_afectado=modelo,
        registro_id=registro_id,
        detalle=detalle,
    )
