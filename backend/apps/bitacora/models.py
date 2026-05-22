from django.db import models
from django.conf import settings


class LogCambio(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="logs",
    )
    accion = models.CharField(max_length=100)
    modelo_afectado = models.CharField(max_length=50)
    registro_id = models.IntegerField()
    detalle = models.TextField(blank=True, default="")
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bitacora"
        verbose_name = "Log de cambio"
        verbose_name_plural = "Bitacora de cambios"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.fecha} | {self.usuario} | {self.accion}"
