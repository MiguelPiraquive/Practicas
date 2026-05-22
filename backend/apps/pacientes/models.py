from django.db import models


class Paciente(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ("CC", "Cedula de Ciudadania"),
        ("TI", "Tarjeta de Identidad"),
        ("CE", "Cedula de Extranjeria"),
        ("PA", "Pasaporte"),
        ("RC", "Registro Civil"),
        ("PPT", "Permiso de Protección Temporal"),
        ("MIL", "Correo electrónico (sin documento)"),
        ("TEL", "Teléfono / Celular (sin documento)"),
        ("SIN", "Sin identificar"),
    ]

    TELEFONO_PERTENECE_CHOICES = [
        ("paciente", "Del paciente"),
        ("autorizado", "De persona autorizada"),
    ]

    tipo_documento = models.CharField(max_length=3, choices=TIPO_DOCUMENTO_CHOICES)
    numero_documento = models.CharField(max_length=120, unique=True)
    nombres = models.CharField(max_length=100, blank=True, default="")
    apellidos = models.CharField(max_length=100, blank=True, default="")
    fecha_nacimiento = models.DateField(null=True, blank=True)
    telefono = models.CharField(max_length=20, blank=True, default="")
    telefono_pertenece_a = models.CharField(
        max_length=20,
        choices=TELEFONO_PERTENECE_CHOICES,
        blank=True,
        default="",
        help_text="Indica si el teléfono es del paciente o de una persona autorizada.",
    )
    nombre_autorizado = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Nombre de la persona autorizada cuando el teléfono no es del paciente.",
    )
    email = models.EmailField(
        blank=True,
        default="",
        help_text="Correo electrónico de contacto (alternativa al teléfono).",
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "pacientes"
        verbose_name = "Paciente"
        verbose_name_plural = "Pacientes"
        ordering = ["apellidos", "nombres"]

    def __str__(self):
        nombre = f"{self.apellidos} {self.nombres}".strip()
        if not nombre:
            nombre = "SIN IDENTIFICAR"
        return f"{nombre} - {self.numero_documento}"
