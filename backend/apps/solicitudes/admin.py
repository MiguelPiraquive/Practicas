from django.contrib import admin
from .models import Solicitud, TipoDocumentoSolicitado, Parentesco, TipoDocumentoIdentidad


@admin.register(Solicitud)
class SolicitudAdmin(admin.ModelAdmin):
    list_display = ["id", "paciente", "estado", "solicitado_por", "fecha_solicitud"]
    list_filter = ["estado"]
    search_fields = ["paciente__nombres", "paciente__apellidos", "paciente__numero_documento"]


@admin.register(TipoDocumentoSolicitado)
class TipoDocumentoSolicitadoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "activo", "fecha_creacion"]
    list_filter = ["activo"]
    search_fields = ["nombre"]


@admin.register(Parentesco)
class ParentescoAdmin(admin.ModelAdmin):
    list_display = ["nombre", "activo", "fecha_creacion"]
    list_filter = ["activo"]
    search_fields = ["nombre"]


@admin.register(TipoDocumentoIdentidad)
class TipoDocumentoIdentidadAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nombre", "activo", "fecha_creacion"]
    list_filter = ["activo"]
    search_fields = ["codigo", "nombre"]
