from rest_framework import serializers
from .models import Permiso, Rol


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ["id", "codigo", "nombre", "modulo", "descripcion"]
        read_only_fields = fields


class RolSerializer(serializers.ModelSerializer):
    permisos = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permiso.objects.all(), required=False
    )
    permisos_detalle = PermisoSerializer(source="permisos", many=True, read_only=True)
    cantidad_permisos = serializers.IntegerField(source="permisos.count", read_only=True)

    class Meta:
        model = Rol
        fields = [
            "id", "nombre", "descripcion", "activo", "es_sistema",
            "permisos", "permisos_detalle", "cantidad_permisos",
            "fecha_creacion", "fecha_actualizacion",
        ]
        read_only_fields = ["id", "es_sistema", "fecha_creacion", "fecha_actualizacion"]

    def update(self, instance, validated_data):
        # Roles del sistema: bloquear cambios destructivos.
        if instance.es_sistema:
            # Permitir editar solo descripcion y activo (mantenerlo activo).
            permitidos = {"descripcion", "activo"}
            bloqueados = set(validated_data.keys()) - permitidos
            if bloqueados:
                raise serializers.ValidationError(
                    {"detail": f"No se pueden editar los campos {sorted(bloqueados)} en un rol del sistema."}
                )
        return super().update(instance, validated_data)
