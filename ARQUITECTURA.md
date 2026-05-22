# Arquitectura del Sistema
## Sistema de Gestion de Historias Clinicas

---

## Stack Tecnologico

| Componente   | Tecnologia                  | Version recomendada |
|--------------|-----------------------------|---------------------|
| Backend      | Python + Django             | Python 3.11+        |
| API REST     | Django REST Framework (DRF) | 3.15+               |
| Base de datos| PostgreSQL                  | 15+                 |
| Frontend     | React + Vite                | React 18+           |
| HTTP Client  | Axios                       | 1.6+                |
| Estilos      | Bootstrap 5                 | 5.3+                |
| Auth tokens  | Simple JWT (djangorestframework-simplejwt) | 5.3+ |
| Despliegue   | PC local del area           | -                   |

---

## Estructura del Proyecto

```
KEVIN GUMO/
|
|-- backend/                    # Proyecto Django
|   |-- config/                 # Configuracion principal de Django
|   |   |-- settings.py
|   |   |-- urls.py
|   |   |-- wsgi.py
|   |
|   |-- apps/
|   |   |-- usuarios/           # App: autenticacion y roles
|   |   |   |-- models.py       # Usuario personalizado con rol
|   |   |   |-- serializers.py
|   |   |   |-- views.py
|   |   |   |-- urls.py
|   |   |
|   |   |-- pacientes/          # App: registro de pacientes
|   |   |   |-- models.py       # Paciente (documento, nombre, etc)
|   |   |   |-- serializers.py
|   |   |   |-- views.py
|   |   |   |-- urls.py
|   |   |
|   |   |-- solicitudes/        # App: solicitudes de historia clinica
|   |   |   |-- models.py       # Solicitud + estados + asignacion
|   |   |   |-- serializers.py
|   |   |   |-- views.py
|   |   |   |-- urls.py
|   |   |
|   |   |-- bitacora/           # App: registro de cambios (auditoria)
|   |       |-- models.py       # Log de acciones
|   |       |-- serializers.py
|   |       |-- views.py
|   |       |-- urls.py
|   |
|   |-- manage.py
|   |-- requirements.txt
|
|-- frontend/                   # Proyecto React (Vite)
|   |-- src/
|   |   |-- components/         # Componentes reutilizables
|   |   |-- pages/              # Paginas principales
|   |   |   |-- Login.jsx
|   |   |   |-- Dashboard.jsx
|   |   |   |-- Solicitudes.jsx
|   |   |   |-- NuevaSolicitud.jsx
|   |   |   |-- DetalleSolicitud.jsx
|   |   |   |-- Pacientes.jsx
|   |   |   |-- Reportes.jsx
|   |   |   |-- Bitacora.jsx
|   |   |
|   |   |-- services/           # Llamadas a la API
|   |   |   |-- api.js
|   |   |   |-- auth.js
|   |   |
|   |   |-- context/            # Context para auth
|   |   |   |-- AuthContext.jsx
|   |   |
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |
|   |-- package.json
|   |-- vite.config.js
|
|-- docs/                       # Documentacion
|   |-- MATRIZ_ALCANCE_MOSCOW.md
|   |-- CRONOGRAMA_14_SEMANAS.md
|   |-- ARQUITECTURA.md
```

---

## Modelo de Base de Datos

### Tabla: usuarios_usuario (Usuario personalizado)
| Campo          | Tipo         | Descripcion                          |
|----------------|--------------|--------------------------------------|
| id             | AutoField    | PK                                   |
| username       | CharField    | Nombre de usuario para login         |
| password       | CharField    | Contrasena (hasheada por Django)      |
| nombre_completo| CharField    | Nombre real del trabajador            |
| rol            | CharField    | 'admin' o 'ventanilla'               |
| activo         | BooleanField | Si el usuario esta activo             |
| fecha_creacion | DateTimeField| Fecha de creacion de la cuenta        |

### Tabla: pacientes_paciente
| Campo              | Tipo         | Descripcion                       |
|--------------------|--------------|-----------------------------------|
| id                 | AutoField    | PK                                |
| tipo_documento     | CharField    | CC, TI, CE, PA                    |
| numero_documento   | CharField    | Numero unico de documento         |
| nombres            | CharField    | Nombres del paciente              |
| apellidos          | CharField    | Apellidos del paciente            |
| fecha_nacimiento   | DateField    | Fecha de nacimiento (opcional)    |
| telefono           | CharField    | Telefono de contacto (opcional)   |
| fecha_registro     | DateTimeField| Cuando se registro en el sistema  |

### Tabla: solicitudes_solicitud
| Campo              | Tipo         | Descripcion                       |
|--------------------|--------------|-----------------------------------|
| id                 | AutoField    | PK                                |
| paciente           | ForeignKey   | -> Paciente                       |
| estado             | CharField    | SOLICITADA/EN_BUSQUEDA/LISTA/ENTREGADA |
| motivo             | TextField    | Motivo de la solicitud            |
| solicitado_por     | ForeignKey   | -> Usuario (quien registro)       |
| responsable_busqueda| ForeignKey  | -> Usuario (quien busca) nullable |
| fecha_solicitud    | DateTimeField| Cuando se creo                    |
| fecha_lista        | DateTimeField| Cuando se marco como lista (null) |
| fecha_entrega      | DateTimeField| Cuando se entrego (nullable)      |
| entregado_a        | CharField    | Nombre de quien recibio           |
| observaciones      | TextField    | Notas adicionales (opcional)      |

### Tabla: bitacora_logcambio
| Campo          | Tipo         | Descripcion                          |
|----------------|--------------|--------------------------------------|
| id             | AutoField    | PK                                   |
| usuario        | ForeignKey   | -> Usuario (quien hizo el cambio)    |
| accion         | CharField    | Descripcion de la accion             |
| modelo_afectado| CharField    | 'Solicitud', 'Paciente', etc         |
| registro_id    | IntegerField | ID del registro afectado             |
| detalle        | TextField    | Detalle del cambio                   |
| fecha          | DateTimeField| Cuando ocurrio                       |

---

## Flujo de Estados (Solicitud)

```
  [SOLICITADA]
       |
       v  (alguien toma la busqueda)
  [EN_BUSQUEDA]
       |
       v  (historia encontrada)
     [LISTA]
       |
       v  (se entrega fisicamente)
  [ENTREGADA]
```

Cada cambio de estado genera un registro en la bitacora automaticamente.

---

## API Endpoints Principales

### Autenticacion
| Metodo | Endpoint              | Descripcion            |
|--------|-----------------------|------------------------|
| POST   | /api/auth/login/      | Obtener token JWT      |
| POST   | /api/auth/refresh/    | Refrescar token        |
| GET    | /api/auth/me/         | Datos del usuario actual|

### Pacientes
| Metodo | Endpoint              | Descripcion            |
|--------|-----------------------|------------------------|
| GET    | /api/pacientes/       | Listar pacientes       |
| POST   | /api/pacientes/       | Crear paciente         |
| GET    | /api/pacientes/:id/   | Detalle de paciente    |
| PUT    | /api/pacientes/:id/   | Editar paciente        |

### Solicitudes
| Metodo | Endpoint                        | Descripcion                |
|--------|---------------------------------|----------------------------|
| GET    | /api/solicitudes/               | Listar con filtros         |
| POST   | /api/solicitudes/               | Crear solicitud            |
| GET    | /api/solicitudes/:id/           | Detalle                    |
| PATCH  | /api/solicitudes/:id/cambiar-estado/ | Cambiar estado        |
| GET    | /api/solicitudes/exportar/      | Exportar a Excel/CSV       |

### Bitacora
| Metodo | Endpoint              | Descripcion            |
|--------|-----------------------|------------------------|
| GET    | /api/bitacora/        | Listar logs con filtros|

---

## Seguridad

- Autenticacion via JWT (access + refresh token)
- Passwords hasheados con PBKDF2 (default de Django)
- Roles verificados en cada endpoint via permisos DRF
- CORS configurado solo para el frontend local
- Variables sensibles en archivo .env (no se sube a git)

---

## Flujo de Comunicacion

```
[Navegador]  <-->  [React App :5173]  <-->  [Django API :8000]  <-->  [PostgreSQL :5432]
                   (Frontend)               (Backend + DRF)          (Base de datos)
```

Despliegue local: todo corre en la misma PC del area.
