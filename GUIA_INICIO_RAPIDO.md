# Guia de Inicio Rapido
## Sistema de Gestion de Historias Clinicas

---

## Requisitos Previos

- Python 3.11+ (ya tienes 3.12)
- Node.js 18+ (ya tienes 20)
- PostgreSQL 15+ instalado y corriendo

---

## 1. Configurar la Base de Datos

Abre pgAdmin o la consola de PostgreSQL y crea la base de datos:

```sql
CREATE DATABASE historias_clinicas;
```

---

## 2. Configurar el Backend

### Editar archivo de entorno
Abre `backend/.env` y cambia la contrasena de PostgreSQL:

```
DATABASE_PASSWORD=tu_password_real_aqui
```

### Activar entorno virtual y migrar
```bash
cd backend
source venv/Scripts/activate    # En Windows Git Bash
# o: venv\Scripts\activate      # En Windows CMD

python manage.py makemigrations
python manage.py migrate
```

### Crear usuario administrador
```bash
python manage.py createsuperuser
```
Te pedira: username, email (opcional), password.
Despues necesitas asignarle el rol y nombre:

```bash
python manage.py shell
```
```python
from apps.usuarios.models import Usuario
u = Usuario.objects.get(username='tu_username')
u.rol = 'admin'
u.nombre_completo = 'Tu Nombre Completo'
u.save()
exit()
```

### Iniciar el servidor backend
```bash
python manage.py runserver
```
El backend correra en: http://localhost:8000

---

## 3. Configurar el Frontend

En otra terminal:
```bash
cd frontend
npm install       # (ya esta instalado, solo si es primera vez)
npm run dev
```
El frontend correra en: http://localhost:5173

---

## 4. Usar el Sistema

1. Abre http://localhost:5173 en el navegador.
2. Inicia sesion con el usuario que creaste.
3. Primero registra pacientes en la seccion "Pacientes".
4. Despues crea solicitudes desde "Nueva Solicitud".
5. Cambia estados desde el detalle de cada solicitud:
   SOLICITADA -> EN BUSQUEDA -> LISTA -> ENTREGADA
6. Consulta la bitacora para ver todos los cambios.
7. Exporta reportes a Excel desde la seccion "Reportes".

---

## Estructura de Carpetas

```
KEVIN GUMO/
|-- backend/           # Django + DRF (API REST)
|   |-- apps/
|   |   |-- usuarios/      # Login, roles
|   |   |-- pacientes/     # CRUD pacientes
|   |   |-- solicitudes/   # Flujo de solicitudes
|   |   |-- bitacora/      # Registro de cambios
|   |-- config/        # settings.py, urls.py
|   |-- .env           # Variables de entorno (no subir a git)
|
|-- frontend/          # React + Vite
|   |-- src/
|       |-- pages/     # Paginas del sistema
|       |-- services/  # Conexion con API
|       |-- context/   # Autenticacion
|       |-- components/# Componentes reutilizables
|
|-- ARQUITECTURA.md
|-- CRONOGRAMA_14_SEMANAS.md
|-- MATRIZ_ALCANCE_MOSCOW.md
```

---

## Comandos Utiles

| Que hacer                    | Comando                                    |
|------------------------------|--------------------------------------------|
| Activar entorno virtual      | `source backend/venv/Scripts/activate`     |
| Correr backend               | `python manage.py runserver`               |
| Correr frontend              | `cd frontend && npm run dev`               |
| Crear migraciones            | `python manage.py makemigrations`          |
| Aplicar migraciones          | `python manage.py migrate`                 |
| Crear superusuario           | `python manage.py createsuperuser`         |
| Admin de Django              | http://localhost:8000/admin/               |
| Build de produccion frontend | `cd frontend && npm run build`             |
