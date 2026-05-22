from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"roles", views.RolViewSet, basename="rol")
router.register(r"permisos", views.PermisoViewSet, basename="permiso")

urlpatterns = [
    path("", include(router.urls)),
]
