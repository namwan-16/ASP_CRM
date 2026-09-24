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