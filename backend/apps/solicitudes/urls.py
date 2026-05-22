from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"tipos-documento", views.TipoDocumentoSolicitadoViewSet, basename="tipo-documento-solicitado")
router.register(r"parentescos", views.ParentescoViewSet, basename="parentesco")
router.register(r"tipos-doc-identidad", views.TipoDocumentoIdentidadViewSet, basename="tipo-doc-identidad")
router.register(r"", views.SolicitudViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
