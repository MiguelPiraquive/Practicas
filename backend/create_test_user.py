import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario

# Crear usuario de prueba
user, created = Usuario.objects.get_or_create(
    username='testuser',
    defaults={
        'email': 'test@example.com',
        'nombre_completo': 'Usuario Prueba',
        'rol': 'ventanilla',
        'is_active': True,
    }
)

if created:
    user.set_password('testpass123')
    user.save()
    print("✓ Usuario creado: testuser / testpass123")
else:
    print("✓ Usuario ya existe: testuser")
    # Actualizar contraseña para estar seguro
    user.set_password('testpass123')
    user.save()
    print(" → Contraseña actualizada a: testpass123")

# Verificar
print(f"\nUsuarios activos: {Usuario.objects.filter(is_active=True).count()}")
