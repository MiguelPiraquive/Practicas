#!/usr/bin/env python
"""
Test login endpoint directly
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario

# Check if testuser exists
print("Checking testuser in database...\n")
try:
    user = Usuario.objects.get(username='testuser')
    print(f"✓ User found: {user.username}")
    print(f"  - is_active: {user.is_active}")
    print(f"  - is_staff: {user.is_staff}")
    print(f"  - Password hash: {user.password[:30]}...")
    
    # Test password
    print(f"\n✓ Testing password verification...")
    if user.check_password('testpass123'):
        print(f"  ✓ Password 'testpass123' is CORRECT")
    else:
        print(f"  ✗ Password 'testpass123' is INCORRECT")
        print(f"    Trying to reset password...")
        user.set_password('testpass123')
        user.save()
        print(f"    ✓ Password reset completed")
        
except Usuario.DoesNotExist:
    print("✗ User 'testuser' not found")
    sys.exit(1)

# Test login endpoint
print(f"\n\nTesting login endpoint directly...\n")
response = requests.post(
    'http://localhost:8000/api/auth/login/',
    json={'username': 'testuser', 'password': 'testpass123'}
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    data = response.json()
    print(f"\n✓ Login successful!")
    print(f"  - Access Token: {data['access'][:40]}...")
    print(f"  - Refresh Token: {data['refresh'][:40]}..." if 'refresh' in data else "")
else:
    print(f"\n✗ Login failed")
    if response.status_code == 400:
        error_data = response.json()
        print(f"  Errors: {error_data}")
