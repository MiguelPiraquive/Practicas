import requests
import json

# 1. LOGIN
login_data = {'username': 'testuser', 'password': 'testpass123'}
response = requests.post('http://localhost:8000/api/auth/login/', json=login_data)
token = response.json()['access']
headers = {'Authorization': f'Bearer {token}'}

# 2. Probar con varias cédulas para ver si Verifik responde
cedulas_prueba = [
    '1015425322',
    '79650000',
    '123456',
]

for cedula in cedulas_prueba:
    print(f'\n--- Probando cedula: {cedula} ---')
    resp = requests.get('http://localhost:8000/api/pacientes/consultar-cedula/', 
                       params={'tipo': 'CC', 'numero': cedula}, 
                       headers=headers,
                       timeout=15)
    data = resp.json()
    if data['encontrado']:
        print(f'OK - Encontrado en {data["fuente"]}')
        print(json.dumps(data['paciente'], indent=2, ensure_ascii=False))
    else:
        print(f'No encontrado')
