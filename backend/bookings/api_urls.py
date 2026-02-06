from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import ServiceViewSet, StaffViewSet, ClientViewSet, BookingViewSet, SessionViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'sessions', SessionViewSet, basename='session')

urlpatterns = [
    path('', include(router.urls)),
]
