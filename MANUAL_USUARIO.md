# Manual de Usuario — Sistema de Ventanilla de Historias Clínicas

**Clínica Junical** · Versión de presentación · 2026

---

## 1. Acceso al sistema

1. Abrir el navegador en la dirección que entregue el área de sistemas
   (por defecto en pruebas: `http://localhost:5174`).
2. Ingresar **usuario** y **contraseña**.
3. Pulsar **Iniciar sesión**.

> Si olvida la contraseña, solicítela al administrador del sistema.

---

## 2. Pantalla principal — Solicitudes

Al iniciar sesión verá la lista de todas las solicitudes con su estado:

| Estado        | Significado                                      |
|---------------|--------------------------------------------------|
| Solicitada    | Acaba de ingresar, todavía nadie la ha tomado.   |
| En búsqueda   | Un funcionario la está buscando en Hosvital.     |
| Lista         | El PDF ya está disponible para entregar.         |
| Entregada     | La HC fue entregada (cierra el caso).            |

Use la barra de búsqueda y el filtro de estado para encontrar una solicitud
rápidamente.

---

## 3. Crear una solicitud nueva (campos 1 a 10)

Pulsar **Nueva Solicitud**. Complete los 10 campos en orden:

1. **Fecha** — se llena sola con el día de hoy.
2. **Hora de recibo** — momento exacto en que llega la solicitud.
3. **Tipo de documento del paciente**:
   - `CC, TI, CE, PA, RC, PPT` para documentos colombianos.
   - `CORREO` si la persona escribió por correo y aún no se sabe la cédula.
   - `TEL` si llamó por teléfono o WhatsApp.
   - `SIN IDENTIFICAR` cuando no hay forma de identificarlo todavía.
4. **Número de documento** — escriba la cédula o el correo / celular y pulse
   **Autocompletar**. El sistema buscará automáticamente:
   1. Primero en la base local de la clínica.
   2. Luego en fuentes públicas (Procuraduría, Policía, Contraloría, ADRES).
5. **Nombre del paciente** — se autocompleta. Si no se identifica, pulse el
   botón **Sin identificar**.
6. **Documento solicitado** — Epicrisis, HC Completa, Resumen, Exámenes…
7. **Motivo** — Continuidad, Trámite EPS, Tutela, Laboral…
8. **Fechas de atención** — rango de fechas. Si la atención sigue activa,
   marque **Hasta la fecha**.
9. **Tipo de trámite** — Ventanilla, Correo, WhatsApp, Oficio, Judicial.
10. **Tipo de solicitud** — *Reclama el paciente* o *Reclama un autorizado*.

Pulsar **Registrar Solicitud**. Pasará automáticamente al detalle para
completar los campos 11 a 20.

---

## 4. Completar la solicitud (campos 11 a 20)

En la pantalla de detalle se completa:

11. Nombre del autorizado (si aplica).
12. Parentesco.
13. Tipo de documento del autorizado.
14. Número de documento del autorizado (con botón Autocompletar).
15. Funcionario que entrega *(automático al pasar a Entregada).*
16. Medio de entrega — Físico.
17. Medio de entrega — Correo.
18. Medio de entrega — WhatsApp.
19. Fecha de entrega *(automática al pasar a Entregada).*
20. Observaciones.

Pulsar **Guardar campos 11-20**.

---

## 5. Generar la historia clínica desde Hosvital

En la sección **Historia clínica (Hosvital)** del detalle:

### Paso 1 — Solicitar el PDF
Pulsar **Solicitar HC a Hosvital**. El sistema:

- Envía a Hosvital la cédula del paciente, el rango de fechas y el tipo
  de HC pedido.
- Recibe el PDF y lo guarda en la solicitud.

> **Nota de la versión actual:** mientras la clínica habilita las
> credenciales de la API de Hosvital, el sistema genera un PDF de
> **simulación** con los datos del paciente. Cuando se activen las
> credenciales reales (en `.env`), el PDF pasará a ser la HC real, sin
> ningún cambio en el flujo de uso.

### Paso 2 — Descargar o enviar
Una vez listo el PDF aparecen dos botones:

- **Descargar PDF** — abre el PDF en una pestaña nueva.
- **Enviar** — selecciona el canal (Correo / WhatsApp), escribe el
  destinatario y pulsa **Enviar**. El sistema:
  - Por correo: envía un email con el PDF adjunto.
  - Por WhatsApp: envía un mensaje con el enlace al PDF (requiere Twilio).

---

## 6. Avanzar el estado

Cada estado tiene un único botón siguiente:

- **Tomar búsqueda** → pasa a *En búsqueda* y registra al usuario actual
  como responsable.
- **Marcar como lista** → pasa a *Lista* (se registra fecha/hora).
- **Registrar entrega** → pasa a *Entregada* (cierra el caso).

---

## 7. Bitácora

Toda acción queda registrada en **Bitácora** con:
- Usuario que la hizo.
- Fecha y hora.
- Tipo de acción.
- Detalle.

Esto permite auditar qué hizo cada funcionario y cuándo.

---

## 8. Reportes y exportación

En la pantalla de **Solicitudes**, pulsar **Exportar Excel** descarga un
archivo con el mismo formato del Excel que actualmente usa la ventanilla
(*ENTREGA HISTORIAS CLÍNICAS VENTANILLA*), con todas las columnas reales.

---

## 9. Pacientes

La sección **Pacientes** lista todos los pacientes registrados en la base
local. Permite:
- Buscar por documento o nombre.
- Editar información de contacto.
- Ver el historial de solicitudes de cada paciente.

---

## 10. Soporte

Ante cualquier problema:
- Verifique su conexión a internet.
- Cierre sesión y vuelva a entrar.
- Si persiste, contactar al área de sistemas.
