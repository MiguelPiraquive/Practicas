import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Paciente
from .serializers import PacienteSerializer
from .consultas_publicas import (
    consultar_procuraduria,
    consultar_policia,
    consultar_contraloria,
    consultar_adres,
)
from apps.bitacora.utils import registrar_log
from apps.permisos.permissions import PermisosPorAccionMixin

logger = logging.getLogger(__name__)


class PacienteViewSet(PermisosPorAccionMixin, viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    filterset_fields = ["tipo_documento", "numero_documento"]
    search_fields = ["nombres", "apellidos", "numero_documento"]
    permisos_requeridos = {
        "list":             "pacientes.ver",
        "retrieve":         "pacientes.ver",
        "create":           "pacientes.crear",
        "update":           "pacientes.editar",
        "partial_update":   "pacientes.editar",
        "destroy":          "pacientes.eliminar",
        "consultar_cedula": "pacientes.consultar_publico",
    }

    def perform_create(self, serializer):
        paciente = serializer.save()
        registrar_log(
            usuario=self.request.user,
            accion="Crear paciente",
            modelo="Paciente",
            registro_id=paciente.id,
            detalle=f"Paciente: {paciente}",
        )

    def perform_update(self, serializer):
        paciente = serializer.save()
        registrar_log(
            usuario=self.request.user,
            accion="Editar paciente",
            modelo="Paciente",
            registro_id=paciente.id,
            detalle=f"Paciente editado: {paciente}",
        )

    @action(detail=False, methods=["get"], url_path="consultar-cedula")
    def consultar_cedula(self, request):
        tipo = request.query_params.get("tipo", "CC").strip().upper()
        numero = request.query_params.get("numero", "").strip()

        if not numero:
            return Response(
                {"error": "El número de documento es requerido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ═══════════════════════════════════════════════════════
        # PASO 1: Base de datos local (instantáneo, siempre funciona)
        # ═══════════════════════════════════════════════════════
        try:
            paciente = Paciente.objects.get(
                tipo_documento=tipo, numero_documento=numero
            )
            return Response({
                "encontrado": True,
                "fuente": "local",
                "paciente": PacienteSerializer(paciente).data,
                "info_publica": None,
            })
        except Paciente.DoesNotExist:
            pass

        # ═══════════════════════════════════════════════════════
        # PASO 2: Consultar entidades públicas EN PARALELO
        # ═══════════════════════════════════════════════════════
        info_publica = self._consultar_entidades_paralelo(tipo, numero)

        if info_publica and info_publica.get("encontrado"):
            tiene_nombre = bool(info_publica.get("nombres") or info_publica.get("apellidos"))
            return Response({
                "encontrado": True,
                "fuente": "entidades_publicas",
                "nombre_encontrado": tiene_nombre,
                "paciente": {
                    "id": None,
                    "tipo_documento": tipo,
                    "numero_documento": numero,
                    "nombres": info_publica.get("nombres", ""),
                    "apellidos": info_publica.get("apellidos", ""),
                    "fecha_nacimiento": None,
                    "telefono": "",
                },
                "info_publica": info_publica,
            })

        # ═══════════════════════════════════════════════════════
        # PASO 3: No encontrado -> el usuario llena manualmente
        # ═══════════════════════════════════════════════════════
        return Response({
            "encontrado": False,
            "fuente": None,
            "paciente": None,
            "info_publica": info_publica,
            "consultas_intentadas": True,
        })

    # ──────────────────────────────────────────────────────────
    def _consultar_entidades_paralelo(self, tipo, numero):
        """Lanza las 4 consultas en hilos paralelos (max 5 seg total)."""
        fuentes = {
            "procuraduria": consultar_procuraduria,
            "policia": consultar_policia,
            "contraloria": consultar_contraloria,
            "adres": consultar_adres,
        }

        resultados = {}
        nombre_encontrado = ""
        eps_info = ""
        antecedentes = {}

        try:
            with ThreadPoolExecutor(max_workers=4) as pool:
                tareas = {
                    pool.submit(fn, tipo, numero): nombre
                    for nombre, fn in fuentes.items()
                }
                for tarea in as_completed(tareas, timeout=6):
                    nombre_fuente = tareas[tarea]
                    try:
                        r = tarea.result(timeout=1)
                        resultados[nombre_fuente] = r

                        if r.get("encontrado") and r.get("nombre_completo"):
                            if len(r["nombre_completo"]) > len(nombre_encontrado):
                                nombre_encontrado = r["nombre_completo"]

                        if r.get("eps"):
                            eps_info = r["eps"]
                        for key_ant in ("antecedentes_disciplinarios", "antecedentes_judiciales", "antecedentes_fiscales"):
                            if r.get(key_ant):
                                antecedentes[key_ant.replace("antecedentes_", "")] = r[key_ant]

                    except Exception as e:
                        logger.debug(f"Fuente {nombre_fuente} falló: {e}")
                        resultados[nombre_fuente] = {"consultado": False, "error": str(e)}

        except Exception as e:
            logger.warning(f"Timeout general consultas públicas: {e}")

        # Separar nombre
        nombres, apellidos = "", ""
        if nombre_encontrado:
            partes = nombre_encontrado.strip().split()
            if len(partes) >= 4:
                nombres = " ".join(partes[:2])
                apellidos = " ".join(partes[2:])
            elif len(partes) == 3:
                nombres = partes[0]
                apellidos = " ".join(partes[1:])
            elif len(partes) == 2:
                nombres = partes[0]
                apellidos = partes[1]
            else:
                nombres = nombre_encontrado

        alguno_encontrado = any(r.get("encontrado") for r in resultados.values())
        fuentes_ok = [k for k, v in resultados.items() if v.get("encontrado")]

        return {
            "encontrado": alguno_encontrado,
            "nombre_completo": nombre_encontrado,
            "nombres": nombres,
            "apellidos": apellidos,
            "eps": eps_info,
            "antecedentes": antecedentes,
            "fuentes_consultadas": list(resultados.keys()),
            "fuentes_con_datos": fuentes_ok,
        }
