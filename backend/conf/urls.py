import sys
from django.conf import settings
from django.urls import path, re_path, include
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.contrib import admin


schema_view = get_schema_view(
    openapi.Info(
        title="E-Shop API",
        default_version="v1",
        description="API documentation for  NIGAT-SHOP",
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("products.urls")),
    path("api/", include("cart.urls")),
    path("api/", include("orders.urls")),
    path("api/payments/", include("payment.urls")),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]

if settings.DEBUG or getattr(settings, "SERVE_MEDIA", False) or "runserver" in sys.argv:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
