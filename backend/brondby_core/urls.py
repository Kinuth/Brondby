from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from authentication.views import (
    CustomTokenObtainPairView,
    MeView,
    UserViewSet,
)
from jobs.views import (
    ClientViewSet,
    ServiceTypeViewSet,
    JobViewSet,
    JobStatusLogViewSet,
    JobAttachmentViewSet,
    DashboardStatsView,
)
from billing.views import InvoiceViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'services', ServiceTypeViewSet, basename='service')
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'status-logs', JobStatusLogViewSet, basename='status-log')
router.register(r'attachments', JobAttachmentViewSet, basename='attachment')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='auth_me'),

    # Dashboard
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),

    # REST APIs
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

