from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario
from apps.permisos.models import Rol, Permiso


class _RolMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ["id", "nombre", "es_sistema"]


class _PermisoMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ["id", "codigo", "nombre", "modulo"]


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True,
        style={"input_type": "password"}, min_length=6,
    )
    roles = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Rol.objects.all(), required=False
    )
    roles_detalle = _RolMiniSerializer(source="roles", many=True, read_only=True)
    permisos_directos = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permiso.objects.all(), required=False
    )
    permisos_directos_detalle = _PermisoMiniSerializer(
        source="permisos_directos", many=True, read_only=True
    )

    class Meta:
        model = Usuario
        fields = [
            "id", "username", "nombre_completo", "rol",
            "is_active", "is_superuser", "password",
            "date_joined", "last_login",
            "roles", "roles_detalle",
            "permisos_directos", "permisos_directos_detalle",
        ]
        read_only_fields = ["id", "is_superuser", "date_joined", "last_login"]

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", None)
        permisos_directos = validated_data.pop("permisos_directos", None)
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria."})
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        if roles is not None:
            user.roles.set(roles)
        if permisos_directos is not None:
            user.permisos_directos.set(permisos_directos)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", None)
        permisos_directos = validated_data.pop("permisos_directos", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        if permisos_directos is not None:
            instance.permisos_directos.set(permisos_directos)
        return instance


class UsuarioMeSerializer(serializers.ModelSerializer):
    """Versión del usuario que se devuelve en /auth/me/ con los
    permisos efectivos para que el frontend pueda construir guardas."""
    roles = _RolMiniSerializer(many=True, read_only=True)
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            "id", "username", "nombre_completo", "rol",
            "is_active", "is_superuser",
            "date_joined", "last_login",
            "roles", "permisos",
        ]
        read_only_fields = fields

    def get_permisos(self, obj):
        from apps.permisos.permissions import permisos_efectivos_codigos
        return sorted(permisos_efectivos_codigos(obj))


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password_nueva = serializers.CharField(write_only=True, min_length=6)

    def validate_password_nueva(self, value):
        validate_password(value)
        return value
