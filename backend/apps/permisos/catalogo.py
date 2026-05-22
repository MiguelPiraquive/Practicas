"""Catálogo estático de permisos y roles del sistema.

Modificar esta lista y correr:
    python manage.py sync_permisos

(El comando `sync_permisos` y las migraciones de datos se basan en estas
constantes para mantener la base de datos alineada con el código.)
"""

# (codigo, nombre, modulo)
PERMISOS_CATALOGO = [
    # ── pacientes ─────────────────────────
    ("pacientes.ver",                 "Ver pacientes",                          "pacientes"),
    ("pacientes.crear",               "Crear pacientes",                        "pacientes"),
    ("pacientes.editar",              "Editar pacientes",                       "pacientes"),
    ("pacientes.eliminar",            "Eliminar pacientes",                     "pacientes"),
    ("pacientes.consultar_publico",   "Consultar entidades públicas (cédula)",  "pacientes"),
    # ── solicitudes ───────────────────────
    ("solicitudes.ver",               "Ver solicitudes",                        "solicitudes"),
    ("solicitudes.crear",             "Crear solicitudes",                      "solicitudes"),
    ("solicitudes.editar",            "Editar solicitudes",                     "solicitudes"),
    ("solicitudes.eliminar",          "Eliminar solicitudes",                   "solicitudes"),
    ("solicitudes.cambiar_estado",    "Cambiar estado de solicitud",            "solicitudes"),
    ("solicitudes.generar_hc",        "Generar historia clínica (Hosvital)",    "solicitudes"),
    ("solicitudes.enviar_hc",         "Enviar HC por correo/WhatsApp",          "solicitudes"),
    ("solicitudes.exportar",          "Exportar solicitudes a Excel",           "solicitudes"),
    # ── catálogos ─────────────────────────
    ("tipos_documento_solicitado.ver",      "Ver tipos de documento solicitado",      "catalogos"),
    ("tipos_documento_solicitado.crear",    "Crear tipo de documento solicitado",     "catalogos"),
    ("tipos_documento_solicitado.editar",   "Editar tipo de documento solicitado",    "catalogos"),
    ("tipos_documento_solicitado.eliminar", "Eliminar tipo de documento solicitado",  "catalogos"),
    ("parentescos.ver",                     "Ver parentescos",                        "catalogos"),
    ("parentescos.crear",                   "Crear parentesco",                       "catalogos"),
    ("parentescos.editar",                  "Editar parentesco",                      "catalogos"),
    ("parentescos.eliminar",                "Eliminar parentesco",                    "catalogos"),
    ("tipos_doc_identidad.ver",             "Ver tipos de documento de identidad",    "catalogos"),
    ("tipos_doc_identidad.crear",           "Crear tipo de documento de identidad",   "catalogos"),
    ("tipos_doc_identidad.editar",          "Editar tipo de documento de identidad",  "catalogos"),
    ("tipos_doc_identidad.eliminar",        "Eliminar tipo de documento de identidad","catalogos"),
    # ── usuarios ──────────────────────────
    ("usuarios.ver",                  "Ver usuarios",                           "usuarios"),
    ("usuarios.crear",                "Crear usuarios",                         "usuarios"),
    ("usuarios.editar",               "Editar usuarios",                        "usuarios"),
    ("usuarios.eliminar",             "Desactivar usuarios",                    "usuarios"),
    ("usuarios.cambiar_password",     "Restablecer contraseña",                 "usuarios"),
    ("usuarios.activar",              "Reactivar usuario",                      "usuarios"),
    # ── roles ─────────────────────────────
    ("roles.ver",                     "Ver roles",                              "roles"),
    ("roles.crear",                   "Crear roles",                            "roles"),
    ("roles.editar",                  "Editar roles",                           "roles"),
    ("roles.eliminar",                "Eliminar roles",                         "roles"),
    # ── bitácora ──────────────────────────
    ("bitacora.ver",                  "Ver bitácora",                           "bitacora"),
    ("bitacora.exportar",             "Exportar bitácora",                      "bitacora"),
    # ── reportes ──────────────────────────
    ("reportes.ver",                  "Ver reportes",                           "reportes"),
    ("reportes.exportar",             "Exportar reportes",                      "reportes"),
]

# Permisos no editables desde la UI de roles (siempre concedidos al admin).
PERMISOS_ALL = [p[0] for p in PERMISOS_CATALOGO]

# Roles preseeded (es_sistema=True: no se pueden borrar, sus permisos NO se editan).
ROLES_SEED = {
    "Administrador": {
        "descripcion": "Acceso total al sistema. Rol no editable.",
        "es_sistema": True,
        "permisos": "*",  # todos
    },
    "Ventanilla": {
        "descripcion": "Operación diaria: pacientes y solicitudes.",
        "es_sistema": True,
        "permisos": [
            "pacientes.ver", "pacientes.crear", "pacientes.editar", "pacientes.consultar_publico",
            "solicitudes.ver", "solicitudes.crear", "solicitudes.editar",
            "solicitudes.cambiar_estado", "solicitudes.generar_hc", "solicitudes.enviar_hc",
            "tipos_documento_solicitado.ver", "parentescos.ver", "tipos_doc_identidad.ver",
            "reportes.ver",
        ],
    },
    "Auditor": {
        "descripcion": "Solo lectura: consulta y auditoría sin modificar.",
        "es_sistema": True,
        "permisos": [
            "pacientes.ver",
            "solicitudes.ver",
            "reportes.ver", "reportes.exportar",
            "bitacora.ver", "bitacora.exportar",
        ],
    },
}

# Etiquetas legibles por módulo (para agruparlos en la UI).
MODULOS_LABEL = {
    "pacientes":   "Pacientes",
    "solicitudes": "Solicitudes",
    "catalogos":   "Catálogos",
    "usuarios":    "Usuarios",
    "roles":       "Roles y permisos",
    "bitacora":    "Bitácora",
    "reportes":    "Reportes",
}
