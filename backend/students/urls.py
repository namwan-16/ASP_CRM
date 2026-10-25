from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import GuardianViewSet, StudentGuardianViewSet, StudentViewSet, emergency_lookup

router = DefaultRouter()
router.register("students", StudentViewSet, basename="student")
router.register("guardians", GuardianViewSet, basename="guardian")
router.register("student-guardians", StudentGuardianViewSet, basename="student-guardian")

urlpatterns = [path("emergency-lookup/", emergency_lookup)] + router.urls