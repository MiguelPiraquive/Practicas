import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings

print('URL=', settings.VERIFIK_API_URL)
print('TOKEN_SET=', bool(settings.VERIFIK_API_TOKEN))
print('TOKEN_LEN=', len(settings.VERIFIK_API_TOKEN or ''))

headers = {
    'Authorization': f"Bearer {settings.VERIFIK_API_TOKEN}",
    'Content-Type': 'application/json',
}
payload = {
    'documentType': 'cedula_ciudadania',
    'documentNumber': '1015425322',
}

try:
    r = requests.post(f"{settings.VERIFIK_API_URL}/verify", json=payload, headers=headers, timeout=12)
    print('STATUS=', r.status_code)
    print('BODY=', r.text[:500])
except Exception as e:
    print('ERROR=', type(e).__name__, str(e))
