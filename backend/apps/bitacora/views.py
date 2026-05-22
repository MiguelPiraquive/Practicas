from rest_framework import viewsets
from .models import LogCambio
from .serializers import LogCambioSerializer
from apps.permisos.permissions import PermisosPorAccionMixin


class LogCambioViewSet(PermisosPorAccionMixin, viewsets.ReadOnlyModelViewSet):
    queryset = LogCambio.objects.select_related("usuario").all().order_by("-fecha")
    serializer_class = LogCambioSerializer
    filterset_fields = ["modelo_afectado", "usuario"]
    search_fields = ["accion", "detalle"]
    ordering_fields = ["fecha"]
    permisos_requeridos = {
        "list":     "bitacora.ver",
        "retrieve": "bitacora.ver",
    }

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        fecha_desde = params.get("fecha_desde")
        fecha_hasta = params.get("fecha_hasta")
        if fecha_desde:
            qs = qs.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__date__lte=fecha_hasta)
        accion = params.get("accion")
        if accion:
            qs = qs.filter(accion__icontains=accion)
        return qs
