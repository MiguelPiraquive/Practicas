import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.pacientes.models import Paciente
from datetime import date

# Crear pacientes de prueba
pacientes_data = [
    {
        'tipo_documento': 'CC',
        'numero_documento': '1015425322',
        'nombres': 'Juan Carlos',
        'apellidos': 'Rodríguez García',
        'fecha_nacimiento': date(1985, 3, 15),
        'telefono': '3001234567',
    },
    {
        'tipo_documento': 'CC',
        'numero_documento': '79650000',
        'nombres': 'María Isabel',
        'apellidos': 'López Martínez',
        'fecha_nacimiento': date(1990, 7, 22),
        'telefono': '3159876543',
    },
    {
        'tipo_documento': 'TI',
        'numero_documento': '54321',
        'nombres': 'Pedro',
        'apellidos': 'González Pérez',
        'fecha_nacimiento': date(2000, 1, 10),
        'telefono': '3105555555',
    },
]

print("Creando pacientes de prueba en BD local...\n")

for data in pacientes_data:
    paciente, created = Paciente.objects.get_or_create(
        tipo_documento=data['tipo_documento'],
        numero_documento=data['numero_documento'],
        defaults={
            'nombres': data['nombres'],
            'apellidos': data['apellidos'],
            'fecha_nacimiento': data['fecha_nacimiento'],
            'telefono': data['telefono'],
        }
    )
    
    status = "✓ CREADO" if created else "✓ YA EXISTE"
    print(f"{status}: {data['tipo_documento']} {data['numero_documento']} - {data['apellidos']} {data['nombres']}")

total = Paciente.objects.count()
print(f"\nTotal pacientes en BD: {total}")
