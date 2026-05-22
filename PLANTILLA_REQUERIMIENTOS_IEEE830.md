# Especificación de Requisitos del Software (ERS)

**Estándar:** IEEE 830-1998
**Proyecto:** _[Nombre del software]_
**Versión:** 1.0
**Fecha:** _[DD/MM/AAAA]_
**Autor(es):** _[Nombre — Cargo]_
**Cliente:** _[Nombre de la empresa / clínica]_

---

## Tabla de Contenido

1. [Introducción](#1-introducción)
2. [Descripción General](#2-descripción-general)
3. [Requisitos Específicos](#3-requisitos-específicos)
4. [Apéndices](#4-apéndices)

---

## 1. Introducción

### 1.1 Propósito
> _Describe brevemente para qué sirve este documento y a quién va dirigido (desarrolladores, cliente, equipo de TI de la empresa, auditores, etc.)._

### 1.2 Alcance
> _Nombre del producto, qué hará (y qué NO hará), beneficios esperados y objetivos del software._

- **Nombre del producto:** _[ej. Sistema de Gestión de Historias Clínicas]_
- **Qué hace:** _[lista breve]_
- **Qué NO hace (exclusiones):** _[lista breve]_
- **Beneficios:** _[lista breve]_

### 1.3 Definiciones, Acrónimos y Abreviaturas

| Término | Definición |
|---|---|
| _[Sigla]_ | _[Significado]_ |
| _[Sigla]_ | _[Significado]_ |

### 1.4 Referencias
> _Documentos relacionados: estándares, manuales, normativas (Ley 1581 de protección de datos, Resolución 1995 de historia clínica, etc.)._

- _[Referencia 1]_
- _[Referencia 2]_

### 1.5 Visión General del Documento
> _Resumen de cómo está organizado el resto del documento._

---

## 2. Descripción General

### 2.1 Perspectiva del Producto
> _¿Es un producto nuevo? ¿Reemplaza un sistema existente? ¿Se integra con otros sistemas? Diagrama de contexto recomendado._

### 2.2 Funciones del Producto
> _Lista de alto nivel de las funcionalidades principales (sin detalle técnico). Una o dos líneas por función._

- F1. _[Función]_
- F2. _[Función]_
- F3. _[Función]_

### 2.3 Características de los Usuarios

| Tipo de Usuario | Formación | Frecuencia de Uso | Privilegios |
|---|---|---|---|
| _[Administrador]_ | _[técnica]_ | _[diaria]_ | _[total]_ |
| _[Operativo]_ | _[básica]_ | _[diaria]_ | _[limitada]_ |

### 2.4 Restricciones
> _Limitaciones que afectan el desarrollo: lenguaje obligatorio, marco legal, hardware disponible, políticas internas, etc._

- _[Restricción 1]_
- _[Restricción 2]_

### 2.5 Suposiciones y Dependencias
> _Cosas que se dan por ciertas y que, de cambiar, afectarían el software (ej: la clínica mantendrá conexión a internet, el servicio externo X seguirá disponible)._

- _[Suposición 1]_
- _[Dependencia 1]_

### 2.6 Requisitos Futuros
> _Funcionalidades que NO entran en esta versión pero se proyectan para próximas iteraciones._

- _[Futuro 1]_

---

## 3. Requisitos Específicos

### 3.1 Requisitos Funcionales

> _Cada requisito se numera, prioriza y describe sin ambigüedad. Usa el formato de tabla por cada RF._

#### RF-001 — _[Nombre del requisito]_
| Campo | Detalle |
|---|---|
| **Descripción** | _[Qué hace el sistema]_ |
| **Entradas** | _[Datos que recibe]_ |
| **Proceso** | _[Lógica/validaciones]_ |
| **Salidas** | _[Resultado esperado]_ |
| **Prioridad** | Alta / Media / Baja |
| **Actor(es)** | _[Quién lo usa]_ |
| **Precondición** | _[Estado previo necesario]_ |
| **Postcondición** | _[Estado tras ejecutarse]_ |

#### RF-002 — _[Nombre]_
_[…repetir tabla…]_

---

### 3.2 Requisitos No Funcionales

#### 3.2.1 Rendimiento
- RNF-R-01: _[ej. el sistema debe responder en < 2 segundos]_

#### 3.2.2 Seguridad
- RNF-S-01: _[autenticación, cifrado, control de acceso]_
- RNF-S-02: _[cumplimiento de normativa de datos]_

#### 3.2.3 Disponibilidad
- RNF-D-01: _[ej. 99% uptime en horario laboral]_

#### 3.2.4 Usabilidad
- RNF-U-01: _[ej. curva de aprendizaje < 2 horas]_

#### 3.2.5 Mantenibilidad
- RNF-M-01: _[ej. código documentado, modular]_

#### 3.2.6 Portabilidad
- RNF-P-01: _[navegadores soportados, sistemas operativos]_

#### 3.2.7 Escalabilidad
- RNF-E-01: _[ej. soportar N usuarios concurrentes]_

---

### 3.3 Requisitos de Interfaces

#### 3.3.1 Interfaces de Usuario (UI)
> _Descripción de pantallas principales, mockups si los hay._

#### 3.3.2 Interfaces de Hardware
> _Lectores, impresoras, scanners, equipos específicos._

#### 3.3.3 Interfaces de Software
> _APIs externas, bases de datos, servicios de terceros (ej. WhatsApp Gateway, servicio de notificaciones)._

#### 3.3.4 Interfaces de Comunicación
> _Protocolos (HTTPS, REST, etc.), puertos, redes._

---

## 4. Apéndices

### 4.1 Glosario
> _Términos técnicos y del dominio del negocio._

### 4.2 Modelo de Datos (preliminar)
> _Diagrama Entidad-Relación o lista de entidades principales._

### 4.3 Diagrama de Arquitectura
> _Imagen / descripción de los componentes (frontend, backend, BD, servicios externos)._

### 4.4 Casos de Uso (resumen)
> _Lista de casos de uso principales con actor → acción → resultado._

### 4.5 Matriz de Trazabilidad
| Requisito | Caso de Uso | Módulo | Prueba |
|---|---|---|---|
| RF-001 | CU-01 | _[módulo]_ | _[test]_ |

### 4.6 Cronograma / Hitos
> _Fases de entrega, fechas clave._

### 4.7 Plan de Despliegue / Instalación
> _Pasos para instalar el software en la infraestructura del cliente: requisitos previos (Docker, Python, Node), pasos de configuración, comandos, verificación post-instalación._

### 4.8 Plan de Capacitación
> _Sesiones de entrenamiento, manuales, soporte post-entrega._

### 4.9 Aprobación

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Autor | _[ ]_ | | |
| Revisor técnico | _[ ]_ | | |
| Aprobador (cliente) | _[ ]_ | | |

---

## Guía rápida para llenarla — Paso a Paso

1. **Encabezado**: nombre del producto, versión, fecha, autor, empresa cliente.
2. **§1.1 Propósito**: una frase: "Este documento describe los requisitos del software X para Y".
3. **§1.2 Alcance**: 3–5 bullets de lo que hace y 2–3 bullets de lo que NO hace.
4. **§1.3 Definiciones**: solo siglas que aparezcan en el documento.
5. **§1.4 Referencias**: normativas y estándares aplicables.
6. **§2.1 Perspectiva**: párrafo + diagrama de contexto (caja del sistema con flechas a actores externos).
7. **§2.2 Funciones**: lista F1…Fn de funciones principales (de 5 a 15 ítems).
8. **§2.3 Usuarios**: tabla con cada rol que tendrá el sistema.
9. **§2.4 Restricciones** y **§2.5 Suposiciones**: lo que ya está decidido y no se discute.
10. **§3.1 RF**: el corazón del documento — una tabla por cada función. Numera RF-001, RF-002…
11. **§3.2 RNF**: copia las subsecciones y pon al menos 1 requisito en cada una.
12. **§3.3 Interfaces**: describe pantallas, APIs y protocolos.
13. **§4 Apéndices**: anexa diagramas, glosario, casos de uso, cronograma.
14. **§4.9 Aprobación**: tabla de firmas — imprescindible para la entrega oficial.

**Tip:** mantén cada requisito **atómico, verificable y sin ambigüedad** (evita "rápido", "fácil", "amigable"; usa números: "< 2 segundos", "soporta 50 usuarios concurrentes").
