"""Permission class genérica para DRF basada en códigos de permiso.

Uso en un ViewSet:

    class MiViewSet(PermisosPorAccionMixin, viewsets.ModelViewSet):
        permisos_requeridos = {
            "list":            "pacientes.ver",
            "retrieve":        "pacientes.ver",
            "create":          "pacientes.crear",
            "update":          "pacientes.editar",
            "partial_update":  "pacientes.editar",
            "destroy":         "pacientes.eliminar",
            "mi_accion":       "pacientes.consultar_publico",
        }
"""

from rest_framework.permissions import BasePermission, IsAuthenticated


def usuario_tiene_permiso(user, codigo: str) -> bool:
    """Verifica si un usuario posee un permiso (por rol o directo)."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    # cache liviano en el request lifecycle
    cache = getattr(user, "_permisos_cache", None)
    if cache is None:
        cache = set(permisos_efectivos_codigos(user))
        user._permisos_cache = cache
    return codigo in cache


def permisos_efectivos_codigos(user):
    """Suma de permisos: rol(es) + permisos directos. Devuelve set[str]."""
    if not user or not user.is_authenticated:
        return set()
    if user.is_superuser:
        # superuser tiene todos los permisos del catálogo
        from .catalogo import PERMISOS_ALL
        return set(PERMISOS_ALL)
    codigos = set()
    for rol in user.roles.filter(activo=True).prefetch_related("permisos"):
        for p in rol.permisos.all():
            codigos.add(p.codigo)
    for p in user.permisos_directos.all():
        codigos.add(p.codigo)
    return codigos


class TienePermiso(BasePermission):
    """Permite la petición si el usuario tiene el código de permiso
    configurado en `view.permisos_requeridos[action]`.

    Si la acción no está en el mapa, se DENIEGA por defecto (fail-closed).
    """

    message = "No tiene permiso para realizar esta acción."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True

        mapa = getattr(view, "permisos_requeridos", None) or {}
        accion = getattr(view, "action", None)

        # Si la vista no declara mapa explícito, denegar por seguridad.
        if not mapa:
            return False

        # Permiso requerido para esta acción.
        codigo = mapa.get(accion)
        if codigo is None:
            # Acción no contemplada en el mapa -> denegar (fail-closed).
            return False
        if codigo == "*":
            # Acción declarada como pública para autenticados.
            return True

        return usuario_tiene_permiso(request.user, codigo)


class PermisosPorAccionMixin:
    """Mixin opcional: añade `TienePermiso` a `permission_classes` y un
    helper `tiene_permiso(codigo)` para chequeos manuales dentro de la
    vista (por ejemplo en filtros de queryset).
    """

    permission_classes = [IsAuthenticated, TienePermiso]

    def tiene_permiso(self, codigo: str) -> bool:
        return usuario_tiene_permiso(self.request.user, codigo)
