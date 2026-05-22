from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from rest_framework.response import Response
from .models import Usuario
from .serializers import UsuarioSerializer, CambiarPasswordSerializer, UsuarioMeSerializer
from apps.bitacora.utils import registrar_log
from apps.permisos.permissions import PermisosPorAccionMixin


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Datos del usuario autenticado + roles + permisos efectivos.
    El frontend usa este endpoint para construir el menú y los
    guardas de UI/rutas."""
    serializer = UsuarioMeSerializer(request.user)
    return Response(serializer.data)


class UsuarioViewSet(PermisosPorAccionMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.all().prefetch_related("roles", "permisos_directos").order_by("nombre_completo")
    serializer_class = UsuarioSerializer
    filterset_fields = ["rol", "is_active"]
    search_fields = ["username", "nombre_completo"]
    ordering_fields = ["username", "nombre_completo", "date_joined", "last_login"]
    permisos_requeridos = {
        "list":             "usuarios.ver",
        "retrieve":         "usuarios.ver",
        "create":           "usuarios.crear",
        "update":           "usuarios.editar",
        "partial_update":   "usuarios.editar",
        "destroy":          "usuarios.eliminar",
        "cambiar_password": "usuarios.cambiar_password",
        "activar":          "usuarios.activar",
    }

    def perform_create(self, serializer):
        usuario = serializer.save()
        registrar_log(
            usuario=self.request.user,
            accion="Crear usuario",
            modelo="Usuario",
            registro_id=usuario.id,
            detalle=f"Usuario creado: {usuario.username} ({usuario.rol})",
        )

    def perform_update(self, serializer):
        usuario = serializer.save()
        registrar_log(
            usuario=self.request.user,
            accion="Editar usuario",
            modelo="Usuario",
            registro_id=usuario.id,
            detalle=f"Usuario editado: {usuario.username}",
        )

    def perform_destroy(self, instance):
        # No eliminar físicamente: desactivar.
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        registrar_log(
            usuario=self.request.user,
            accion="Desactivar usuario",
            modelo="Usuario",
            registro_id=instance.id,
            detalle=f"Usuario desactivado: {instance.username}",
        )

    @action(detail=True, methods=["post"], url_path="cambiar-password")
    def cambiar_password(self, request, pk=None):
        usuario = self.get_object()
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario.set_password(serializer.validated_data["password_nueva"])
        usuario.save()
        registrar_log(
            usuario=request.user,
            accion="Cambio de contraseña",
            modelo="Usuario",
            registro_id=usuario.id,
            detalle=f"Contraseña restablecida para {usuario.username}",
        )
        return Response({"detail": "Contraseña actualizada."})

    @action(detail=True, methods=["post"], url_path="activar")
    def activar(self, request, pk=None):
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save(update_fields=["is_active"])
        registrar_log(
            usuario=request.user,
            accion="Activar usuario",
            modelo="Usuario",
            registro_id=usuario.id,
            detalle=f"Usuario activado: {usuario.username}",
        )
        return Response(self.get_serializer(usuario).data)
