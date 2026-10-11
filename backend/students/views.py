import io
import re

from django.db.models import Q

from django.db import transaction
from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework import serializers, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.response import Response

from accounts.permissions import AdminOnly, AdminWrite, is_admin, visible_students
from config.query import filter_id
from config.lifecycle import HistoryConflict, student_has_history
from .imports import HEADERS, import_students

from .models import Guardian, Student, StudentGuardian
from .serializers import (
    EmergencyStudentSerializer,
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
        qs = visible_students(self.request.user).select_related("subject_course").prefetch_related("guardian_links__guardian").order_by("last_name", "first_name", "id")
        if "is_active" in self.request.query_params:
            active = serializers.BooleanField().run_validation(self.request.query_params["is_active"])
            qs = qs.filter(is_active=active)
        return qs

    @transaction.atomic
    def perform_destroy(self, instance):
        instance = Student.objects.select_for_update().get(pk=instance.pk)
        if student_has_history(instance):
            raise HistoryConflict("This student has enrolment, class, attendance or progress-note history. Deactivate the student instead.")
        instance.delete()

    @action(detail=True, methods=["post"], permission_classes=[AdminOnly])
    def deactivate(self, request, pk=None):
        student = self.get_object()
        student.is_active = False
        student.save(update_fields=["is_active", "updated_at"])
        return Response(self.get_serializer(student).data)

    @action(detail=True, methods=["post"], permission_classes=[AdminOnly])
    def reactivate(self, request, pk=None):
        student = self.get_object()
        student.is_active = True
        student.save(update_fields=["is_active", "updated_at"])
        return Response(self.get_serializer(student).data)

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
        from classes.models import Course
        subject_name = Course.objects.filter(is_active=True).values_list("name", flat=True).first() or ""
        workbook.active.append(["", "Example", "Student", "2013-01-15", "Example School", "Year 7", subject_name,
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

    @transaction.atomic
    def perform_destroy(self, instance):
        instance = Guardian.objects.select_for_update().get(pk=instance.pk)
        if instance.student_links.exists():
            raise HistoryConflict("This guardian is linked to a student. Remove the relevant student–guardian links before deleting an unused guardian.")
        instance.delete()


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


@api_view(["GET"])
def emergency_lookup(request):
    search = request.query_params.get("search", "").strip()
    if len(search) > 100:
        raise serializers.ValidationError({"search": "Enter up to 100 characters."})
    qs = visible_students(request.user).order_by("last_name", "first_name", "id")
    match = re.fullmatch(r"(?:ASP[ -]?)?(\d+)", search, re.IGNORECASE)
    if not search:
        qs = qs.none()
    elif match:
        student_id = int(match.group(1))
        qs = qs.filter(pk=student_id) if student_id <= 9223372036854775807 else qs.none()
    else:
        for token in search.split():
            qs = qs.filter(Q(first_name__icontains=token) | Q(last_name__icontains=token))
    from config.pagination import CrmPagination
    paginator = CrmPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(EmergencyStudentSerializer(page, many=True).data)
