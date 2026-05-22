from django.contrib import admin
from .models import LogCambio


@admin.register(LogCambio)
class LogCambioAdmin(admin.ModelAdmin):
    list_display = ["fecha", "usuario", "accion", "modelo_afectado", "registro_id"]
    list_filter = ["modelo_afectado"]
    search_fields = ["accion", "detalle"]
    readonly_fields = ["fecha", "usuario", "accion", "modelo_afectado", "registro_id", "detalle"]
