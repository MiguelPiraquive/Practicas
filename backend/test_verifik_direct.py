import requests
import json

# Verificar directamente contra la API de Verifik
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjbGllbnRJZCI6IjY5YzFjOTk2MTk5MzVmOTI3ZGI5NDQ2ZCIsIkpXVFBocmFzZSI6IjY5YzFjODI3ODlmNjZlY2Q0YzY2YzVhYiIsImV4cGlyZXNBdCI6MTc3Njk4NjQ1MCwiaWF0IjoxNzc0MzA4MDUwfQ._YqcdYr2vl-6pXIk_jx0QW7JyUOCO9i3srMTp8H9GuE"

print("Probando Verifik API directamente...")
print(f"Token: {token[:50]}...\n")

# Probar directamente
cedula = "1015425322"
print(f"Buscando cédula: {cedula}")

try:
    resp = requests.post(
        "https://api.verifikapi.com/v2/verify",
        json={
            "documentType": "cedula_ciudadania",
            "documentNumber": cedula,
        },
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=10,
    )
    
    print(f"Status: {resp.status_code}")
    print(f"Response:\n{json.dumps(resp.json(), indent=2, ensure_ascii=False)}")
    
except Exception as e:
    print(f"Error: {e}")
