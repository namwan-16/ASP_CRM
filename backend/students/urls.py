<<<<<<< HEAD
from django.urls import path

from .views import (
    StudentImportTemplateView,
    StudentImportView,
    StudentListView,
)


urlpatterns = [
    path(
        "",
        StudentListView.as_view(),
        name="student-list",
    ),

    path(
        "import/",
        StudentImportView.as_view(),
        name="student-import",
    ),

    path(
        "import/template/",
        StudentImportTemplateView.as_view(),
        name="student-import-template",
    ),
]
=======
from rest_framework.routers import DefaultRouter

from .views import GuardianViewSet, StudentGuardianViewSet, StudentViewSet

router = DefaultRouter()
router.register("students", StudentViewSet, basename="student")
router.register("guardians", GuardianViewSet, basename="guardian")
router.register("student-guardians", StudentGuardianViewSet, basename="student-guardian")

urlpatterns = router.urls
>>>>>>> origin/tshewang
