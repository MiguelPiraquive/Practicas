from rest_framework import serializers
from .models import Solicitud, TipoDocumentoSolicitado, Parentesco, TipoDocumentoIdentidad
from apps.pacientes.serializers import PacienteSerializer
from apps.usuarios.serializers import UsuarioSerializer


class TipoDocumentoSolicitadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumentoSolicitado
        fields = ["id", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion"]
        read_only_fields = ["id", "fecha_creacion", "fecha_actualizacion"]


class ParentescoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parentesco
        fields = ["id", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion"]
        read_only_fields = ["id", "fecha_creacion", "fecha_actualizacion"]


class TipoDocumentoIdentidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDocumentoIdentidad
        fields = ["id", "codigo", "nombre", "activo", "fecha_creacion", "fecha_actualizacion"]
        read_only_fields = ["id", "fecha_creacion", "fecha_actualizacion"]


class SolicitudSerializer(serializers.ModelSerializer):
    paciente_detalle = PacienteSerializer(source="paciente", read_only=True)
    solicitado_por_detalle = UsuarioSerializer(source="solicitado_por", read_only=True)
    responsable_busqueda_detalle = UsuarioSerializer(source="responsable_busqueda", read_only=True)
    funcionario_entrega_detalle = UsuarioSerializer(source="funcionario_entrega", read_only=True)

    # Etiquetas legibles para campos con choices
    documento_solicitado_display = serializers.CharField(
        source="documento_solicitado", read_only=True
    )
    motivo_solicitud_display = serializers.CharField(
        source="get_motivo_solicitud_display", read_only=True
    )
    tipo_tramite_display = serializers.CharField(
        source="get_tipo_tramite_display", read_only=True
    )
    hosvital_estado_display = serializers.CharField(
        source="get_hosvital_estado_display", read_only=True
    )
    envio_estado_display = serializers.CharField(
        source="get_envio_estado_display", read_only=True
    )
    archivo_hc_url = serializers.SerializerMethodField()

    def get_archivo_hc_url(self, obj):
        if obj.archivo_hc:
            # Devolver siempre la URL relativa (/media/...). El frontend la
            # consume bajo el mismo origen vía el proxy de Vite, evitando que
            # el navegador bloquee el iframe por X-Frame-Options o COEP.
            return obj.archivo_hc.url
        return None

    class Meta:
        model = Solicitud
        fields = "__all__"
        read_only_fields = ["id", "fecha_solicitud", "solicitado_por"]
