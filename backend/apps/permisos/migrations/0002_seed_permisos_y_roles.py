"""Siembra el catálogo de permisos, los 3 roles del sistema y migra
los usuarios existentes (campo legado `rol`) a la nueva relación M2M.
"""
from django.db import migrations


def seed_permisos_roles(apps, schema_editor):
    Permiso = apps.get_model("permisos", "Permiso")
    Rol = apps.get_model("permisos", "Rol")
    Usuario = apps.get_model("usuarios", "Usuario")

    # Importamos el catálogo desde el código (no toca la BD).
    from apps.permisos.catalogo import PERMISOS_CATALOGO, ROLES_SEED

    # 1) Sembrar todos los permisos (idempotente).
    permisos_por_codigo = {}
    for codigo, nombre, modulo in PERMISOS_CATALOGO:
        permiso, _ = Permiso.objects.update_or_create(
            codigo=codigo,
            defaults={"nombre": nombre, "modulo": modulo},
        )
        permisos_por_codigo[codigo] = permiso

    # 2) Sembrar roles del sistema.
    for nombre_rol, cfg in ROLES_SEED.items():
        rol, _ = Rol.objects.update_or_create(
            nombre=nombre_rol,
            defaults={
                "descripcion": cfg["descripcion"],
                "activo": True,
                "es_sistema": cfg["es_sistema"],
            },
        )
        if cfg["permisos"] == "*":
            rol.permisos.set(permisos_por_codigo.values())
        else:
            rol.permisos.set([permisos_por_codigo[c] for c in cfg["permisos"]])

    # 3) Migrar usuarios existentes: rol CharField -> M2M roles.
    admin_rol = Rol.objects.get(nombre="Administrador")
    ventanilla_rol = Rol.objects.get(nombre="Ventanilla")

    for u in Usuario.objects.all():
        # No tocar si ya tiene roles asignados.
        if u.roles.exists():
            continue
        if u.is_superuser or u.rol == "admin":
            u.roles.add(admin_rol)
        else:
            u.roles.add(ventanilla_rol)


def reverse(apps, schema_editor):
    # Reversa segura: solo limpia los M2M; deja Permisos/Roles intactos
    # (otras tablas pueden referenciarlos).
    Usuario = apps.get_model("usuarios", "Usuario")
    for u in Usuario.objects.all():
        u.roles.clear()
        u.permisos_directos.clear()


class Migration(migrations.Migration):

    dependencies = [
        ("permisos", "0001_initial"),
        ("usuarios", "0002_usuario_permisos_directos_usuario_roles"),
    ]

    operations = [
        migrations.RunPython(seed_permisos_roles, reverse),
    ]
