from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"usuarios", views.UsuarioViewSet, basename="usuario")

urlpatterns = [
    path("me/", views.me, name="usuario-me"),
    path("", include(router.urls)),
]
