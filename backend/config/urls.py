from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Auth JWT
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("apps.usuarios.urls")),
    path("api/auth/", include("apps.permisos.urls")),
    # Apps
    path("api/pacientes/", include("apps.pacientes.urls")),
    path("api/solicitudes/", include("apps.solicitudes.urls")),
    path("api/bitacora/", include("apps.bitacora.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
