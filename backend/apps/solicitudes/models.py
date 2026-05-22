from django.db import models
from django.conf import settings


class TipoDocumentoSolicitado(models.Model):
    """Catálogo editable de tipos de documento que un paciente puede solicitar."""

    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, default="")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tipos_documento_solicitado"
        verbose_name = "Tipo de documento solicitado"
        verbose_name_plural = "Tipos de documento solicitado"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Parentesco(models.Model):
    """Catálogo editable de parentescos del tercero autorizado."""

    nombre = models.CharField(max_length=80, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, default="")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "parentescos"
        verbose_name = "Parentesco"
        verbose_name_plural = "Parentescos"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class TipoDocumentoIdentidad(models.Model):
    """Catálogo editable de tipos de documento de identidad (CC, TI, CE…)."""

    codigo = models.CharField(max_length=10, unique=True, help_text="Sigla: CC, TI, CE, etc.")
    nombre = models.CharField(max_length=120, help_text="Nombre completo del tipo de documento.")
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tipos_documento_identidad"
        verbose_name = "Tipo de documento de identidad"
        verbose_name_plural = "Tipos de documento de identidad"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Solicitud(models.Model):
    ESTADO_CHOICES = [
        ("SOLICITADA", "Solicitada"),
        ("EN_BUSQUEDA", "En busqueda"),
        ("LISTA", "Lista"),
        ("ENTREGADA", "Entregada"),
    ]

    DOCUMENTO_SOLICITADO_CHOICES = [
        ("EPICRISIS", "Epicrisis"),
        ("HC_COMPLETA", "Historia Clínica Completa"),
        ("RESUMEN", "Resumen de Historia Clínica"),
        ("EXAMENES", "Copia de Exámenes"),
        ("LABORATORIO", "Resultados de Laboratorio"),
        ("IMAGENES", "Imágenes Diagnósticas"),
        ("CERT_MEDICO", "Certificado Médico"),
        ("INCAPACIDAD", "Incapacidad"),
        ("URGENCIAS", "Urgencias"),
        ("OTRO", "Otro"),
    ]

    MOTIVO_SOLICITUD_CHOICES = [
        ("CONTINUIDAD", "Continuidad de tratamiento"),
        ("EPS", "Trámite EPS"),
        ("JUDICIAL", "Trámite Judicial"),
        ("PERSONAL", "Solicitud Personal"),
        ("REFERENCIA", "Referencia y Contrarreferencia"),
        ("TUTELA", "Tutela/Acción Legal"),
        ("LABORAL", "Trámite Laboral"),
        ("OTRO", "Otro"),
    ]

    TIPO_TRAMITE_CHOICES = [
        ("VENTANILLA", "Ventanilla"),
        ("CORREO", "Correo Electrónico"),
        ("WHATSAPP", "WhatsApp"),
        ("OFICIO", "Oficio"),
        ("JUDICIAL", "Requerimiento Judicial"),
    ]

    TIPO_DOC_CHOICES = [
        ("CC", "Cédula de Ciudadanía"),
        ("TI", "Tarjeta de Identidad"),
        ("CE", "Cédula de Extranjería"),
        ("PA", "Pasaporte"),
        ("RC", "Registro Civil"),
        ("PPT", "Permiso de Protección Temporal"),
    ]

    HOSVITAL_ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente"),
        ("EN_PROCESO", "En proceso"),
        ("RECIBIDA", "Recibida (PDF disponible)"),
        ("ERROR", "Error al consultar Hosvital"),
    ]

    ENVIO_ESTADO_CHOICES = [
        ("PENDIENTE", "Pendiente de envío"),
        ("ENVIADO", "Enviada al paciente"),
        ("ERROR", "Error al enviar"),
    ]

    # === PACIENTE ===
    paciente = models.ForeignKey(
        "pacientes.Paciente",
        on_delete=models.PROTECT,
        related_name="solicitudes",
    )
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="SOLICITADA")

    # === DETALLE DE LA SOLICITUD ===
    hora_recibo = models.TimeField(null=True, blank=True, verbose_name="Hora recibo (cuando entró)")
    hora_envio = models.TimeField(null=True, blank=True, verbose_name="Hora envío (cuando se entregó)")
    documento_solicitado = models.CharField(
        max_length=100, blank=True, default=""
    )
    motivo_solicitud = models.CharField(
        max_length=200, blank=True, default="",
        verbose_name="Motivo de la solicitud (texto libre)"
    )
    # Campo libre heredado (mantener por compatibilidad)
    motivo = models.TextField(blank=True, default="")
    fechas_atencion = models.CharField(
        max_length=300, blank=True, default="", verbose_name="Fechas de atención (texto)"
    )
    fecha_atencion_desde = models.DateField(null=True, blank=True, verbose_name="Atención desde")
    fecha_atencion_hasta = models.DateField(null=True, blank=True, verbose_name="Atención hasta")
    atencion_hasta_la_fecha = models.BooleanField(default=False, verbose_name="Hasta la fecha")

    # === TIPO DE SOLICITUD ===
    tipo_tramite = models.CharField(
        max_length=20, choices=TIPO_TRAMITE_CHOICES, blank=True, default=""
    )
    tiene_autorizado = models.BooleanField(default=False)
    nombre_autorizado = models.CharField(max_length=200, blank=True, default="")
    parentesco_autorizado = models.CharField(max_length=100, blank=True, default="")
    tipo_doc_autorizado = models.CharField(
        max_length=3, choices=TIPO_DOC_CHOICES, blank=True, default=""
    )
    numero_doc_autorizado = models.CharField(max_length=20, blank=True, default="")

    # === FUNCIONARIO Y ENTREGA ===
    solicitado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="solicitudes_creadas",
    )
    responsable_busqueda = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="solicitudes_asignadas",
    )
    funcionario_entrega = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="solicitudes_entregadas",
    )
    medio_entrega_fisico = models.BooleanField(default=False, verbose_name="Entrega física")
    medio_entrega_correo = models.BooleanField(default=False, verbose_name="Entrega por correo")
    medio_entrega_whatsapp = models.BooleanField(default=False, verbose_name="Entrega por WhatsApp")

    # === FECHAS ===
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    fecha_lista = models.DateTimeField(null=True, blank=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    entregado_a = models.CharField(max_length=200, blank=True, default="")
    observaciones = models.TextField(blank=True, default="")

    # === HOSVITAL — descarga del PDF de la HC ===
    archivo_hc = models.FileField(
        upload_to="historias_clinicas/", null=True, blank=True,
        verbose_name="Archivo PDF de la HC"
    )
    hosvital_estado = models.CharField(
        max_length=20, choices=HOSVITAL_ESTADO_CHOICES,
        default="PENDIENTE", blank=True
    )
    hosvital_mensaje = models.TextField(blank=True, default="")
    hosvital_fecha = models.DateTimeField(null=True, blank=True)

    # === ENVÍO al paciente (correo / WhatsApp) ===
    envio_estado = models.CharField(
        max_length=20, choices=ENVIO_ESTADO_CHOICES,
        default="PENDIENTE", blank=True
    )
    envio_destinatario = models.CharField(max_length=200, blank=True, default="")
    envio_canal = models.CharField(max_length=20, blank=True, default="")  # CORREO / WHATSAPP
    envio_mensaje = models.TextField(blank=True, default="")
    envio_fecha = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "solicitudes"
        verbose_name = "Solicitud"
        verbose_name_plural = "Solicitudes"
        ordering = ["-fecha_solicitud"]

    def __str__(self):
        return f"SOL-{self.id} | {self.paciente} | {self.estado}"
