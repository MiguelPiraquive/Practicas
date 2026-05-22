from django.db import models


class Permiso(models.Model):
    """Permiso atómico del sistema. El catálogo se mantiene desde
    `apps.permisos.catalogo.PERMISOS_CATALOGO` y se sincroniza vía
    migración de datos o el comando `sync_permisos`.
    """

    codigo = models.CharField(max_length=80, unique=True)
    nombre = models.CharField(max_length=150)
    modulo = models.CharField(max_length=50, db_index=True)
    descripcion = models.TextField(blank=True, default="")

    class Meta:
        db_table = "permisos"
        verbose_name = "Permiso"
        verbose_name_plural = "Permisos"
        ordering = ["modulo", "codigo"]

    def __str__(self):
        return self.codigo


class Rol(models.Model):
    """Rol agrupador de permisos. Los roles `es_sistema=True` son
    inmutables (no se pueden borrar y sus permisos no se editan desde
    la UI). Los demás los administra el superusuario."""

    nombre = models.CharField(max_length=80, unique=True)
    descripcion = models.TextField(blank=True, default="")
    activo = models.BooleanField(default=True)
    es_sistema = models.BooleanField(
        default=False,
        help_text="Si es True, el rol no se puede borrar ni editar sus permisos.",
    )
    permisos = models.ManyToManyField(Permiso, blank=True, related_name="roles")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "roles"
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
