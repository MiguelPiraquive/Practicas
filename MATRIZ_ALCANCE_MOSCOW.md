# Matriz de Alcance MoSCoW
## Sistema de Gestion de Historias Clinicas - MVP 14 Semanas

---

## MUST (Obligatorio - Sin esto no hay sistema)

| #  | Funcionalidad                          | Detalle                                                                 |
|----|----------------------------------------|-------------------------------------------------------------------------|
| M1 | Login y roles                          | 2 roles: Administrador y Ventanilla. Acceso con usuario y contrasena.   |
| M2 | Registro de solicitud                  | Ventanilla registra: paciente (doc. identidad, nombre), motivo, fecha.  |
| M3 | Flujo de estados                       | Cada solicitud pasa por: SOLICITADA -> EN BUSQUEDA -> LISTA -> ENTREGADA. |
| M4 | Asignacion de responsable              | Quien busca la historia queda registrado.                               |
| M5 | Registro de entrega                    | Fecha/hora de entrega, a quien se entrego, firma o confirmacion.        |
| M6 | Validaciones basicas                   | Documento unico por paciente, campos obligatorios, formato de fechas.   |
| M7 | Busqueda y filtros                     | Buscar por: documento del paciente, estado, rango de fechas.            |
| M8 | Bitacora de cambios                    | Registro automatico: quien hizo que, cuando (cada cambio de estado).    |
| M9 | Reporte basico exportable              | Listado de solicitudes filtrado, exportable a Excel/CSV.                |

---

## SHOULD (Importante - Incluir si el tiempo alcanza)

| #  | Funcionalidad                          | Detalle                                                                 |
|----|----------------------------------------|-------------------------------------------------------------------------|
| S1 | Dashboard resumen                      | Contadores: solicitudes hoy, pendientes, entregadas. Vista rapida.      |
| S2 | Historial por paciente                 | Ver todas las solicitudes anteriores de un mismo paciente.              |
| S3 | Tiempo de respuesta                    | Calcular automaticamente cuanto tardo desde solicitud hasta entrega.    |
| S4 | Reporte por periodo                    | Reporte mensual/semanal con totales por estado.                         |

---

## COULD (Deseable - Solo si sobra tiempo, fase 2)

| #  | Funcionalidad                          | Detalle                                                                 |
|----|----------------------------------------|-------------------------------------------------------------------------|
| C1 | Notificaciones                         | Aviso cuando una solicitud lleva mucho tiempo sin atender.              |
| C2 | Graficas estadisticas                  | Graficos de barras/torta en dashboard.                                  |
| C3 | Gestion de usuarios por admin          | Admin puede crear/editar/desactivar usuarios desde el sistema.          |
| C4 | Auditoria detallada por campo          | Registrar que campo especifico cambio (valor anterior vs nuevo).        |

---

## WON'T (No se hara en esta version)

| #  | Funcionalidad                          | Razon                                                                   |
|----|----------------------------------------|-------------------------------------------------------------------------|
| W1 | Integraciones con sistemas externos    | Fuera del alcance de practicas.                                         |
| W2 | App movil                              | No requerido, el sistema es para uso interno en ventanilla.             |
| W3 | Digitalizacion/escaneo de historias    | Requiere hardware y alcance muy amplio.                                 |
| W4 | Gestion de citas medicas               | Fuera del objetivo del sistema.                                         |

---

## Resumen de conteo

| Prioridad | Cantidad | Estado          |
|-----------|----------|-----------------|
| MUST      | 9        | Obligatorio     |
| SHOULD    | 4        | Si alcanza      |
| COULD     | 4        | Fase 2          |
| WON'T     | 4        | Descartado v1   |

> **Criterio de exito del MVP:** Los 9 MUST funcionando y probados con usuarios reales.
