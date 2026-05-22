from rest_framework import serializers
from .models import LogCambio
from apps.usuarios.serializers import UsuarioSerializer


class LogCambioSerializer(serializers.ModelSerializer):
    usuario_detalle = UsuarioSerializer(source="usuario", read_only=True)

    class Meta:
        model = LogCambio
        fields = "__all__"
        read_only_fields = ["id", "fecha"]
