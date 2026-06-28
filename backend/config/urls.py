from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('superadmin/', admin.site.urls),
    path('api/v1/', include('common.api_urls')),
    path('api/', include('common.api_urls')),  # Backward compatibility
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
