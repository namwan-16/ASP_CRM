import io

from django.db import transaction
from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import AdminOnly, AdminWrite, is_admin, visible_students
from config.query import filter_id
from .imports import HEADERS, import_students

from .models import Guardian, Student, StudentGuardian
from .serializers import (
    GuardianSerializer,
    StudentGuardianSerializer,
    StudentSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):
    throttle_scope = None
    queryset = Student.objects.all().order_by("last_name", "first_name")
    serializer_class = StudentSerializer
    permission_classes = [AdminWrite]
    search_fields = ["first_name", "last_name", "school", "phone", "guardian_links__guardian__first_name", "guardian_links__guardian__last_name"]
    ordering_fields = ["first_name", "last_name", "created_at"]

    def get_queryset(self):
        qs = visible_students(self.request.user).prefetch_related("guardian_links__guardian").order_by("last_name", "first_name")
        if "is_active" in self.request.query_params:
            active = serializers.BooleanField().run_validation(self.request.query_params["is_active"])
            qs = qs.filter(is_active=active)
        return qs

    @action(detail=True, methods=["get"], url_path="emergency-contacts")
    def emergency_contacts(self, request, pk=None):
        student = self.get_object()
        links = student.guardian_links.filter(is_emergency_contact=True).select_related("guardian").order_by("-is_primary_contact", "id")
        return Response({"student": self.get_serializer(student).data,
                         "contacts": StudentGuardianSerializer(links, many=True).data})

    @action(detail=False, methods=["post"], permission_classes=[AdminOnly], url_path="import", throttle_scope="import")
    def import_file(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"file": ["Select an Excel or CSV file."]}, status=400)
        dry_run = serializers.BooleanField().run_validation(request.data.get("dry_run", False))
        return Response(import_students(upload, dry_run))

    @action(detail=False, methods=["get"], permission_classes=[AdminOnly], url_path="import-template")
    def import_template(self, request):
        workbook = Workbook()
        workbook.active.title = "Students"
        workbook.active.append(HEADERS)
        workbook.active.append(["", "Example", "Student", "2013-01-15", "Example School", "Year 7", "Mathematics",
                                "", "", "No", "Yes", "", "", "Example", "Guardian", "0400000001", "guardian@example.com", "Mother", "Yes", "Yes"])
        for column in ("I", "P"):
            workbook.active[f"{column}2"].number_format = "@"
        buffer = io.BytesIO()
        workbook.save(buffer)
        response = HttpResponse(buffer.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = 'attachment; filename="student-import-template.xlsx"'
        return response


class GuardianViewSet(viewsets.ModelViewSet):
    queryset = Guardian.objects.all().order_by("last_name", "first_name")
    serializer_class = GuardianSerializer
    permission_classes = [AdminWrite]
    search_fields = ["first_name", "last_name", "phone", "email", "student_links__student__first_name", "student_links__student__last_name"]
    ordering_fields = ["first_name", "last_name", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset().prefetch_related("student_links__student")
        return qs if is_admin(self.request.user) else qs.filter(student_links__student__in=visible_students(self.request.user)).distinct()


class StudentGuardianViewSet(viewsets.ModelViewSet):
    queryset = StudentGuardian.objects.select_related(
        "student",
        "guardian",
    ).all()
    serializer_class = StudentGuardianSerializer
    permission_classes = [AdminWrite]

    def get_queryset(self):
        qs = super().get_queryset().filter(student__in=visible_students(self.request.user))
        qs = filter_id(qs, self.request.query_params, "student")
        return filter_id(qs, self.request.query_params, "guardian")

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        student_id = serializers.IntegerField(min_value=1).run_validation(request.data.get("student"))
        list(Student.objects.select_for_update().filter(pk=student_id))
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        link = self.get_object()
        student_id = serializers.IntegerField(min_value=1).run_validation(request.data.get("student", link.student_id))
        list(Student.objects.select_for_update().filter(pk__in=[student_id, link.student_id]).order_by("pk"))
        return super().update(request, *args, **kwargs)
