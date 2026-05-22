from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ["username", "nombre_completo", "rol", "is_active"]
    list_filter = ["rol", "is_active"]
    fieldsets = UserAdmin.fieldsets + (
        ("Info adicional", {"fields": ("nombre_completo", "rol")}),
    )
