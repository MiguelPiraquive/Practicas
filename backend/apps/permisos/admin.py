from django.contrib import admin
from .models import Permiso, Rol


@admin.register(Permiso)
class PermisoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "modulo")
    list_filter = ("modulo",)
    search_fields = ("codigo", "nombre")
    readonly_fields = ("codigo", "nombre", "modulo", "descripcion")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activo", "es_sistema", "fecha_creacion")
    list_filter = ("activo", "es_sistema")
    search_fields = ("nombre",)
    filter_horizontal = ("permisos",)
    readonly_fields = ("es_sistema", "fecha_creacion", "fecha_actualizacion")

    def has_delete_permission(self, request, obj=None):
        if obj and obj.es_sistema:
            return False
        return super().has_delete_permission(request, obj)
