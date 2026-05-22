import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("solicitudes", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Motivo pasa a ser opcional (campo libre heredado)
        migrations.AlterField(
            model_name="solicitud",
            name="motivo",
            field=models.TextField(blank=True, default=""),
        ),
        # Hora del trámite
        migrations.AddField(
            model_name="solicitud",
            name="hora_envio",
            field=models.TimeField(blank=True, null=True, verbose_name="Hora envío"),
        ),
        # Documento solicitado (Epicrisis, HC Completa, etc.)
        migrations.AddField(
            model_name="solicitud",
            name="documento_solicitado",
            field=models.CharField(
                blank=True,
                choices=[
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
                ],
                default="",
                max_length=20,
            ),
        ),
        # Motivo estructurado (Continuidad, EPS, etc.)
        migrations.AddField(
            model_name="solicitud",
            name="motivo_solicitud",
            field=models.CharField(
                blank=True,
                choices=[
                    ("CONTINUIDAD", "Continuidad de tratamiento"),
                    ("EPS", "Trámite EPS"),
                    ("JUDICIAL", "Trámite Judicial"),
                    ("PERSONAL", "Solicitud Personal"),
                    ("REFERENCIA", "Referencia y Contrarreferencia"),
                    ("TUTELA", "Tutela/Acción Legal"),
                    ("LABORAL", "Trámite Laboral"),
                    ("OTRO", "Otro"),
                ],
                default="",
                max_length=20,
            ),
        ),
        # Fechas de atención (periodo médico solicitado)
        migrations.AddField(
            model_name="solicitud",
            name="fechas_atencion",
            field=models.CharField(
                blank=True, default="", max_length=300, verbose_name="Fechas de atención"
            ),
        ),
        # Tipo de trámite (Ventanilla, Correo, WhatsApp, etc.)
        migrations.AddField(
            model_name="solicitud",
            name="tipo_tramite",
            field=models.CharField(
                blank=True,
                choices=[
                    ("VENTANILLA", "Ventanilla"),
                    ("CORREO", "Correo Electrónico"),
                    ("WHATSAPP", "WhatsApp"),
                    ("OFICIO", "Oficio"),
                    ("JUDICIAL", "Requerimiento Judicial"),
                ],
                default="",
                max_length=20,
            ),
        ),
        # ¿Tiene autorizado? (tercero autorizado para recoger)
        migrations.AddField(
            model_name="solicitud",
            name="tiene_autorizado",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="solicitud",
            name="nombre_autorizado",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
        migrations.AddField(
            model_name="solicitud",
            name="parentesco_autorizado",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="solicitud",
            name="tipo_doc_autorizado",
            field=models.CharField(
                blank=True,
                choices=[
                    ("CC", "Cédula de Ciudadanía"),
                    ("TI", "Tarjeta de Identidad"),
                    ("CE", "Cédula de Extranjería"),
                    ("PA", "Pasaporte"),
                    ("RC", "Registro Civil"),
                ],
                default="",
                max_length=2,
            ),
        ),
        migrations.AddField(
            model_name="solicitud",
            name="numero_doc_autorizado",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        # Funcionario que hace la entrega física
        migrations.AddField(
            model_name="solicitud",
            name="funcionario_entrega",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="solicitudes_entregadas",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Medios de entrega (checkboxes)
        migrations.AddField(
            model_name="solicitud",
            name="medio_entrega_fisico",
            field=models.BooleanField(default=False, verbose_name="Entrega física"),
        ),
        migrations.AddField(
            model_name="solicitud",
            name="medio_entrega_correo",
            field=models.BooleanField(default=False, verbose_name="Entrega por correo"),
        ),
        migrations.AddField(
            model_name="solicitud",
            name="medio_entrega_whatsapp",
            field=models.BooleanField(default=False, verbose_name="Entrega por WhatsApp"),
        ),
    ]
