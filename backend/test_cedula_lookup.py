#!/usr/bin/env python
"""
Test cedula lookup endpoint with test patient data
"""
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework_simplejwt.tokens import RefreshToken
from apps.usuarios.models import Usuario
import requests

# Get/create test user
user, created = Usuario.objects.get_or_create(
    username='testuser',
    defaults={'is_active': True}
)
if created:
    user.set_password('testpass123')
    user.save()
    print("✓ Test user created")
else:
    print("✓ Test user exists")

# Get JWT token
refresh = RefreshToken.for_user(user)
token = str(refresh.access_token)
print(f"✓ JWT Token obtained: {token[:40]}...")

# Test cedula lookups
cedulas = [
    ('CC', '1015425322'),
    ('CC', '79650000'),
    ('TI', '54321'),
]

print("\n======== TESTING CEDULA LOOKUPS ========\n")

for tipo, numero in cedulas:
    url = f'http://localhost:8000/api/pacientes/consultar-cedula/?tipo={tipo}&numero={numero}'
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        data = response.json()
        
        if data.get('encontrado'):
            paciente = data['paciente']
            print(f"✓ {tipo} {numero}: ENCONTRADO")
            print(f"  Fuente: {data['fuente']}")
            print(f"  Nombre: {paciente['nombres']} {paciente['apellidos']}")
            print(f"  Nacimiento: {paciente['fecha_nacimiento']}\n")
        else:
            print(f"✗ {tipo} {numero}: NO ENCONTRADO\n")
            
    except Exception as e:
        print(f"✗ {tipo} {numero}: ERROR - {e}\n")

print("✓ Cedula lookup tests complete!")
