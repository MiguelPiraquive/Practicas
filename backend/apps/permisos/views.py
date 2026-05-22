from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Permiso, Rol
from .serializers import PermisoSerializer, RolSerializer
from .permissions import TienePermiso, PermisosPorAccionMixin
from .catalogo import MODULOS_LABEL
from apps.bitacora.utils import registrar_log


class PermisoViewSet(PermisosPorAccionMixin, viewsets.ReadOnlyModelViewSet):
    """Catálogo de permisos (solo lectura). Lo gestiona el código."""

    queryset = Permiso.objects.all().order_by("modulo", "codigo")
    serializer_class = PermisoSerializer
    pagination_class = None
    filterset_fields = ["modulo"]
    search_fields = ["codigo", "nombre"]
    permisos_requeridos = {
        "list":     "roles.ver",
        "retrieve": "roles.ver",
        "agrupados": "roles.ver",
    }

    from rest_framework.decorators import action

    @action(detail=False, methods=["get"], url_path="agrupados")
    def agrupados(self, request):
        """Devuelve los permisos agrupados por módulo para construir la UI."""
        permisos = list(self.get_queryset().values("id", "codigo", "nombre", "modulo", "descripcion"))
        grupos: dict[str, dict] = {}
        for p in permisos:
            mod = p["modulo"]
            grupos.setdefault(mod, {"modulo": mod, "label": MODULOS_LABEL.get(mod, mod.title()), "permisos": []})
            grupos[mod]["permisos"].append(p)
        return Response(list(grupos.values()))


class RolViewSet(PermisosPorAccionMixin, viewsets.ModelViewSet):
    queryset = Rol.objects.all().prefetch_related("permisos").order_by("nombre")
    serializer_class = RolSerializer
    filterset_fields = ["activo", "es_sistema"]
    search_fields = ["nombre"]
    permisos_requeridos = {
        "list":           "roles.ver",
        "retrieve":       "roles.ver",
        "create":         "roles.crear",
        "update":         "roles.editar",
        "partial_update": "roles.editar",
        "destroy":        "roles.eliminar",
    }

    def perform_create(self, serializer):
        rol = serializer.save()
        registrar_log(
            usuario=self.request.user, accion="Crear rol",
            modelo="Rol", registro_id=rol.id,
            detalle=f"Rol creado: {rol.nombre}",
        )

    def perform_update(self, serializer):
        rol = serializer.save()
        registrar_log(
            usuario=self.request.user, accion="Editar rol",
            modelo="Rol", registro_id=rol.id,
            detalle=f"Rol editado: {rol.nombre}",
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.es_sistema:
            return Response(
                {"detail": "No se puede eliminar un rol del sistema."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Si hay usuarios con este rol, desactivar (no borrar) para no romper FKs.
        if instance.usuarios.exists():
            instance.activo = False
            instance.save(update_fields=["activo"])
            registrar_log(
                usuario=request.user, accion="Desactivar rol",
                modelo="Rol", registro_id=instance.id,
                detalle=f"Rol desactivado (en uso): {instance.nombre}",
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        nombre = instance.nombre
        rid = instance.id
        instance.delete()
        registrar_log(
            usuario=request.user, accion="Eliminar rol",
            modelo="Rol", registro_id=rid,
            detalle=f"Rol eliminado: {nombre}",
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
