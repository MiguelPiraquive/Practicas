from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    # ─── Compatibilidad con datos previos ────────────────────────────
    # `rol` (CharField) se mantiene como columna legada para no romper
    # registros existentes; el sistema real de permisos vive en los M2M
    # `roles` y `permisos_directos`. Una migración de datos copia el
    # valor antiguo al rol del sistema correspondiente.
    ROL_CHOICES = [
        ("admin", "Administrador"),
        ("ventanilla", "Ventanilla"),
    ]

    nombre_completo = models.CharField(max_length=200)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default="ventanilla")

    # ─── Sistema de roles y permisos granulares ──────────────────────
    roles = models.ManyToManyField(
        "permisos.Rol",
        blank=True,
        related_name="usuarios",
        help_text="Roles asignados al usuario (suma de permisos).",
    )
    permisos_directos = models.ManyToManyField(
        "permisos.Permiso",
        blank=True,
        related_name="usuarios",
        help_text="Permisos otorgados directamente al usuario, adicionales a los del rol.",
    )

    class Meta:
        db_table = "usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombre_completo} ({self.rol})"

    # ─── Helpers de permisos ─────────────────────────────────────────
    def permisos_efectivos(self):
        """Conjunto (set[str]) de códigos de permiso del usuario:
        unión de los permisos de sus roles activos + los directos.
        Superusuarios obtienen el catálogo completo.
        """
        from apps.permisos.permissions import permisos_efectivos_codigos
        return permisos_efectivos_codigos(self)

    def tiene_permiso(self, codigo: str) -> bool:
        from apps.permisos.permissions import usuario_tiene_permiso
        return usuario_tiene_permiso(self, codigo)
