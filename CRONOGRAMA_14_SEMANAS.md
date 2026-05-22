# Cronograma de Desarrollo - 14 Semanas
## Sistema de Gestion de Historias Clinicas - MVP

Inicio estimado: Semana 1 del periodo de practicas
Duracion: 14 semanas (3.5 meses)

---

## FASE 1: PLANIFICACION (Semanas 1-2)

### Semana 1 - Levantamiento y alcance
| Dia       | Actividad                                              |
|-----------|--------------------------------------------------------|
| Lun-Mar   | Reunion con tutor/area: entender el proceso actual     |
| Mie-Jue   | Documentar flujo actual (como se hace hoy sin sistema) |
| Vie       | Cerrar alcance: confirmar matriz MoSCoW con el area    |

### Semana 2 - Diseno
| Dia       | Actividad                                              |
|-----------|--------------------------------------------------------|
| Lun-Mar   | Mockups/wireframes de las pantallas principales        |
| Mie       | Diseno del modelo de base de datos                     |
| Jue-Vie   | Definir tecnologias y configurar entorno de desarrollo |

**Entregable Fase 1:** Documento de alcance firmado, mockups, modelo de BD.

---

## FASE 2: DESARROLLO CORE (Semanas 3-8)

### Semana 3-4 - Base del sistema
| Semana | Actividad                                                |
|--------|----------------------------------------------------------|
| Sem 3  | Setup proyecto (estructura, BD, conexion, autenticacion) |
| Sem 4  | Login funcional + CRUD de pacientes                      |

### Semana 5-6 - Flujo principal
| Semana | Actividad                                                |
|--------|----------------------------------------------------------|
| Sem 5  | Registro de solicitud + cambio de estados                |
| Sem 6  | Asignacion de responsable + registro de entrega          |

### Semana 7-8 - Consultas y bitacora
| Semana | Actividad                                                |
|--------|----------------------------------------------------------|
| Sem 7  | Busqueda con filtros + listado de solicitudes             |
| Sem 8  | Bitacora automatica de cambios + validaciones            |

**Entregable Fase 2:** Sistema funcional con flujo completo de solicitud a entrega.

---

## FASE 3: REPORTES Y MEJORAS (Semanas 9-10)

### Semana 9 - Reportes
| Semana | Actividad                                                |
|--------|----------------------------------------------------------|
| Sem 9  | Reporte basico exportable (Excel/CSV) con filtros        |

### Semana 10 - Mejoras SHOULD (si hay tiempo)
| Semana | Actividad                                                |
|--------|----------------------------------------------------------|
| Sem 10 | Dashboard resumen + historial por paciente               |

**Entregable Fase 3:** Reportes funcionales, dashboard basico.

---

## FASE 4: PRUEBAS (Semanas 11-12)

### Semana 11 - Pruebas internas
| Dia       | Actividad                                              |
|-----------|--------------------------------------------------------|
| Lun-Mie   | Pruebas funcionales (todos los flujos)                 |
| Jue-Vie   | Correccion de errores encontrados                      |

### Semana 12 - Pruebas con usuarios
| Dia       | Actividad                                              |
|-----------|--------------------------------------------------------|
| Lun-Mie   | Pruebas con personal de ventanilla (usuarios reales)   |
| Jue-Vie   | Ajustes segun retroalimentacion                        |

**Entregable Fase 4:** Sistema probado y validado por usuarios.

---

## FASE 5: CIERRE (Semanas 13-14)

### Semana 13 - Documentacion
| Dia       | Actividad                                              |
|-----------|--------------------------------------------------------|
| Lun-Mie   | Manual de usuario basico                               |
| Jue-Vie   | Documentacion tecnica (instalacion, BD, arquitectura)  |

### Semana 14 - Despliegue y entrega
| Dia       | Actividad                                              |
|-----------|--------------------------------------------------------|
| Lun-Mar   | Despliegue en entorno del area/hospital                |
| Mie       | Capacitacion rapida al personal                        |
| Jue-Vie   | Entrega formal + presentacion final                    |

**Entregable Fase 5:** Sistema desplegado, documentacion, presentacion.

---

## RESUMEN VISUAL (Gantt simplificado)

```
Semana:  1  2  3  4  5  6  7  8  9  10 11 12 13 14
         |--|--|--|--|--|--|--|--|--|--|--|--|--|--|
FASE 1:  [====]                                      Planificacion
FASE 2:        [==================]                  Desarrollo core
FASE 3:                             [=====]          Reportes/mejoras
FASE 4:                                   [=====]   Pruebas
FASE 5:                                         [====] Cierre
```

---

## HITOS CLAVE

| Hito | Semana | Descripcion                                |
|------|--------|--------------------------------------------|
| H1   | 2      | Alcance cerrado y aprobado                 |
| H2   | 4      | Login y CRUD funcionando                   |
| H3   | 6      | Flujo completo de solicitud a entrega      |
| H4   | 8      | Bitacora y validaciones listas             |
| H5   | 9      | Reportes exportables funcionando           |
| H6   | 12     | Pruebas con usuarios completadas           |
| H7   | 14     | Entrega formal del sistema                 |

---

## RIESGOS Y MITIGACION

| Riesgo                                  | Mitigacion                                    |
|-----------------------------------------|-----------------------------------------------|
| Cambios de alcance a mitad del proyecto | Alcance firmado en semana 2, cambios van a v2 |
| Poca disponibilidad de usuarios prueba  | Agendar pruebas desde semana 1                |
| Problemas tecnicos de despliegue        | Probar despliegue desde semana 10             |
| Tiempo insuficiente para SHOULD         | Priorizar MUST, SHOULD es opcional            |

---

> Este cronograma esta disenado para entregar un MVP solido y funcional.
> Los items SHOULD se incluyen solo si las fases anteriores terminan a tiempo.
> Los items COULD quedan documentados para una version 2.
