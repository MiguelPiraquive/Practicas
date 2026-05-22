from django.contrib import admin
from .models import Paciente


@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    list_display = ["numero_documento", "tipo_documento", "nombres", "apellidos", "fecha_registro"]
    search_fields = ["nombres", "apellidos", "numero_documento"]
    list_filter = ["tipo_documento"]
