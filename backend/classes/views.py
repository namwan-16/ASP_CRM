import csv

from django.db import connection, transaction
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import AdminWrite, assigned_sessions, is_admin, visible_students
from config.query import filter_id
from students.models import Guardian
from .models import Attendance, ClassSession, Course, ProgressNote, Registration
from .serializers import AttendanceSerializer, ClassSessionSerializer, CourseSerializer, ProgressNoteSerializer, RegistrationSerializer


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [AdminWrite]
    queryset = Course.objects.all()
    search_fields = ["name", "description"]
    ordering_fields = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs if is_admin(self.request.user) else qs.filter(sessions__in=assigned_sessions(self.request.user)).distinct()


class RegistrationViewSet(viewsets.ModelViewSet):
    serializer_class = RegistrationSerializer
    permission_classes = [AdminWrite]
    search_fields = ["student__first_name", "student__last_name", "course__name"]

    def get_queryset(self):
        qs = Registration.objects.select_related("student", "course").filter(student__in=visible_students(self.request.user))
        if not is_admin(self.request.user):
            qs = qs.filter(course__sessions__in=assigned_sessions(self.request.user)).distinct()
        qs = filter_id(qs, self.request.query_params, "student")
        return filter_id(qs, self.request.query_params, "course")


class ClassSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    permission_classes = [AdminWrite]
    search_fields = ["course__name", "room", "presenter__first_name", "presenter__last_name"]
    ordering_fields = ["date", "start_time", "id"]

    def get_queryset(self):
        qs = assigned_sessions(self.request.user).select_related("course", "presenter", "assistant").prefetch_related("students")
        return filter_id(qs, self.request.query_params, "course")

    def lock_schedule(self):
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_xact_lock(%s)", [6202027])

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self.lock_schedule()
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self.lock_schedule()
        ClassSession.objects.select_for_update().get(pk=self.get_object().pk)
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["get"])
    def roster(self, request, pk=None):
        session = self.get_object()
        attendance = {row.student_id: row for row in session.attendance.all()}
        return Response({"session": self.get_serializer(session).data, "students": [
            {"id": student.pk, "name": str(student), "year_level": student.year_level,
             "status": attendance[student.pk].status if student.pk in attendance else "",
             "notes": attendance[student.pk].notes if student.pk in attendance else ""}
            for student in session.students.order_by("last_name", "first_name")
        ]})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="attendance")
    @transaction.atomic
    def mark_attendance(self, request, pk=None):
        session = self.get_object()
        ClassSession.objects.select_for_update().get(pk=session.pk)
        records = request.data.get("records") if isinstance(request.data, dict) else None
        if not isinstance(records, list) or not records or len(records) > 500:
            raise ValidationError({"records": "Send between 1 and 500 attendance records."})
        checked, errors, student_ids = [], [], set()
        for index, row in enumerate(records):
            if not isinstance(row, dict):
                errors.append({"row": index + 1, "errors": "Expected an object."})
                continue
            data = {"session": session.pk, "student": row.get("student"), "status": row.get("status"), "notes": row.get("notes", "")}
            student_field = serializers.IntegerField(min_value=1)
            try:
                student_id = student_field.run_validation(row.get("student"))
            except ValidationError as exc:
                errors.append({"row": index + 1, "errors": {"student": exc.detail}})
                continue
            if student_id in student_ids:
                errors.append({"row": index + 1, "errors": "Duplicate student in request."})
                continue
            student_ids.add(student_id)
            instance = Attendance.objects.filter(session=session, student_id=student_id).first()
            serializer = AttendanceSerializer(instance, data=data, context={"request": request})
            if serializer.is_valid():
                checked.append(serializer)
            else:
                errors.append({"row": index + 1, "errors": serializer.errors})
        if errors:
            raise ValidationError({"errors": errors})
        for serializer in checked:
            serializer.save(marked_by=request.user)
        return Response({"saved": len(checked)})


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["student__first_name", "student__last_name", "session__course__name"]

    def get_queryset(self):
        qs = Attendance.objects.select_related("student", "session__course", "marked_by").filter(session__in=assigned_sessions(self.request.user))
        qs = filter_id(qs, self.request.query_params, "session")
        return filter_id(qs, self.request.query_params, "student")

    def perform_create(self, serializer):
        with transaction.atomic():
            ClassSession.objects.select_for_update().get(pk=serializer.validated_data["session"].pk)
            serializer.validate(serializer.validated_data)
            serializer.save(marked_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(marked_by=self.request.user)

    def perform_destroy(self, instance):
        if not is_admin(self.request.user):
            raise PermissionDenied("Only an admin can delete attendance history.")
        instance.delete()


class ProgressNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressNoteSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["student__first_name", "student__last_name", "text"]
    ordering_fields = ["date", "created_at"]

    def get_queryset(self):
        qs = ProgressNote.objects.select_related("student", "author").filter(student__in=visible_students(self.request.user))
        qs = qs.filter(Q(session__isnull=True) | Q(session__in=assigned_sessions(self.request.user)))
        return filter_id(qs, self.request.query_params, "student")

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def check_author(self, instance):
        if not is_admin(self.request.user) and instance.author_id != self.request.user.pk:
            raise PermissionDenied("You may only edit or delete notes you wrote.")

    def perform_update(self, serializer):
        self.check_author(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self.check_author(instance)
        instance.delete()


@api_view(["GET"])
def dashboard(request):
    students = visible_students(request.user)
    sessions = assigned_sessions(request.user)
    counts = dict(Attendance.objects.filter(session__in=sessions).values("status").annotate(total=Count("id")).values_list("status", "total"))
    return Response({"students": students.count(), "active_students": students.filter(is_active=True).count(),
                     "guardians": Guardian.objects.filter(student_links__student__in=students).distinct().count(),
                     "sessions_today": sessions.filter(date=timezone.localdate()).count(),
                     "attendance": counts, "progress_notes": ProgressNote.objects.filter(student__in=students).filter(Q(session__isnull=True) | Q(session__in=sessions)).count()})


def safe_cell(value):
    value = str(value)
    return "'" + value if value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")) else value


@api_view(["GET"])
def attendance_report(request):
    qs = Attendance.objects.select_related("session__course", "student", "marked_by").filter(session__in=assigned_sessions(request.user))
    qs = filter_id(qs, request.query_params, "session")
    for key, lookup in (("date_from", "session__date__gte"), ("date_to", "session__date__lte")):
        if request.query_params.get(key):
            date = serializers.DateField().run_validation(request.query_params[key])
            qs = qs.filter(**{lookup: date})
    if request.query_params.get("status"):
        status = serializers.ChoiceField(choices=Attendance.Status.choices).run_validation(request.query_params["status"])
        qs = qs.filter(status=status)
    if request.query_params.get("export") == "csv":
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="attendance.csv"'
        writer = csv.writer(response)
        writer.writerow(["Date", "Course", "Student ID", "Student", "Status", "Notes", "Marked by"])
        for row in qs.iterator():
            writer.writerow([safe_cell(value) for value in (row.session.date, row.session.course.name, row.student_id, row.student, row.status, row.notes, row.marked_by or "")])
        return response
    from config.pagination import CrmPagination
    paginator = CrmPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response(AttendanceSerializer(page, many=True).data)
