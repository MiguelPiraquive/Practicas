# Requerimientos Técnicos — Sistema de Ventanilla de HC

**Clínica Junical** · Documento de presentación · 2026

---

## 1. Requerimientos físicos (hardware)

### Servidor (donde corre el sistema)
| Componente   | Mínimo                          | Recomendado                |
|--------------|---------------------------------|----------------------------|
| Procesador   | Intel Core i3 / AMD Ryzen 3     | Intel i5 / Ryzen 5         |
| RAM          | 4 GB                            | 8 GB                       |
| Disco        | 20 GB libres                    | 50 GB SSD                  |
| Red          | Conexión a internet estable     | LAN clínica + internet     |

### Equipos de los usuarios (ventanilla)
| Componente   | Mínimo                          |
|--------------|---------------------------------|
| Procesador   | Cualquier PC moderno (≥ 2018)   |
| RAM          | 4 GB                            |
| Pantalla     | 1366×768 mínimo                 |
| Navegador    | Chrome, Edge o Firefox actual   |
| Periféricos  | Teclado, mouse, conexión a red  |

> **No requiere instalar nada en los equipos de los usuarios.** Solo
> necesitan abrir el navegador y entrar a la dirección del sistema.

---

## 2. Requerimientos lógicos (software)

### En el servidor
- **Sistema operativo:** Windows 10/11, Linux (Ubuntu 20.04+) o Windows Server.
- **Python 3.11 o superior**.
- **Node.js 18 o superior** (solo si se va a recompilar el frontend).
- **PostgreSQL 14 o superior** como base de datos.
- **Git** para clonar el proyecto.

### Librerías Python (se instalan con `pip install -r requirements.txt`)
- Django 6.x — framework web.
- Django REST Framework — API.
- djangorestframework-simplejwt — autenticación con tokens.
- psycopg2-binary — conector PostgreSQL.
- openpyxl — generación de archivos Excel.
- reportlab — generación de PDFs (modo simulación de Hosvital).
- requests — llamadas a APIs externas.
- beautifulsoup4 — scraping de fuentes públicas.
- python-dotenv — variables de entorno.

### Librerías Frontend (se instalan con `npm install`)
- React 18.
- React Router DOM 6.
- Vite 8.
- Axios.

---

## 3. Servicios externos (opcionales)

| Servicio                | Para qué                              | Estado actual                    |
|-------------------------|---------------------------------------|----------------------------------|
| **API de Hosvital**     | Descargar el PDF real de la HC.       | Pendiente de credenciales.       |
| **Servidor SMTP**       | Enviar correos al paciente.           | Configurable (Gmail u otro).     |
| **Twilio WhatsApp**     | Enviar HC por WhatsApp.               | Opcional. Modo simulado activo.  |
| **Procuraduría/Policía/Contraloría/ADRES** | Autocompletado de datos del paciente. | Funciona sin credenciales (público). |

Cada servicio se configura en el archivo `backend/.env` y el sistema
funciona aunque ninguno esté disponible (modo simulación).

---

## 4. Arquitectura — visión general

```
┌─────────────────────┐         ┌──────────────────────┐
│  Navegador (React)  │ ◀────▶ │   Backend Django     │
│  http://localhost   │  HTTPS  │  (puerto 8000)       │
└─────────────────────┘         └──────────┬───────────┘
                                           │
                                ┌──────────┴───────────┐
                                ▼                      ▼
                       ┌────────────────┐    ┌──────────────────┐
                       │  PostgreSQL    │    │  APIs externas   │
                       │  (datos)       │    │  Hosvital, SMTP, │
                       │                │    │  Twilio, Públicas│
                       └────────────────┘    └──────────────────┘
```

- El **frontend** corre en el navegador, no instala nada en el equipo.
- El **backend** corre en el servidor de la clínica.
- La **base de datos** guarda toda la información de pacientes,
  solicitudes, usuarios y bitácora.
- Los **PDFs de las HC** se guardan en la carpeta `backend/media/`.

---

## 5. Cómo iniciar el sistema (resumen técnico)

### Backend
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

### Crear el primer usuario
```powershell
cd backend
python manage.py createsuperuser
```

---

## 6. Variables de configuración (`backend/.env`)

```env
# Base de datos
DATABASE_NAME=historias_clinicas
DATABASE_USER=postgres
DATABASE_PASSWORD=...
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Hosvital (cuando se entreguen credenciales)
HOSVITAL_API_URL=
HOSVITAL_API_TOKEN=

# Correo (para enviar HC al paciente)
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...

# WhatsApp (Twilio, opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

---

## 7. Seguridad

- Autenticación por **JWT** (tokens firmados, expiran en 8 horas).
- **CORS** restringido a las direcciones permitidas.
- **Bitácora completa** de todas las acciones críticas.
- Contraseñas almacenadas con **hash PBKDF2** (estándar Django).
- Variables sensibles fuera del código fuente (en `.env`).
- Conexión recomendada por **HTTPS** en producción.

---

## 8. Datos almacenados

- **Pacientes:** documento, nombre, teléfono, fecha de nacimiento.
- **Solicitudes:** los 20 campos del Excel real + estados + PDF.
- **Usuarios:** funcionarios de la ventanilla con rol (admin / ventanilla).
- **Bitácora:** auditoría completa de acciones (qué, quién, cuándo).
- **PDFs de HC:** archivos descargados desde Hosvital (carpeta `media/`).

---

## 9. Mantenimiento

- **Backup diario** de la base de datos PostgreSQL (`pg_dump`).
- **Backup semanal** de la carpeta `backend/media/` (PDFs guardados).
- Revisar la **bitácora** semanalmente.
- Actualizar dependencias con `pip install -U -r requirements.txt` cada
  trimestre.
