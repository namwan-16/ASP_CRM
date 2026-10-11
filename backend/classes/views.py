import csv

<<<<<<< HEAD
from django.db import transaction
=======
from django.db import connection, transaction
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

<<<<<<< HEAD
from accounts.permissions import AdminOnly, AdminWrite, assigned_sessions, is_admin, visible_students
from config.query import filter_id
from config.lifecycle import HistoryConflict, course_is_used
from students.models import Guardian
from .models import Attendance, ClassSession, Course, NoteEvent, ProgressNote, Registration
from .scheduling import lock_schedule
from .serializers import AttendanceSerializer, ClassSessionSerializer, CourseSerializer, ProgressNoteSerializer, RegistrationSerializer, SessionStatusEventSerializer
=======
from accounts.permissions import AdminWrite, assigned_sessions, is_admin, visible_students
from config.query import filter_id
from students.models import Guardian
from .models import Attendance, ClassSession, Course, ProgressNote, Registration
from .serializers import AttendanceSerializer, ClassSessionSerializer, CourseSerializer, ProgressNoteSerializer, RegistrationSerializer
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b


class CourseViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSerializer
    permission_classes = [AdminWrite]
    queryset = Course.objects.all()
    search_fields = ["name", "description"]
    ordering_fields = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        return qs if is_admin(self.request.user) else qs.filter(sessions__in=assigned_sessions(self.request.user)).distinct()

<<<<<<< HEAD
    @transaction.atomic
    def perform_destroy(self, instance):
        instance = Course.objects.select_for_update().get(pk=instance.pk)
        if course_is_used(instance):
            raise HistoryConflict("This subject is used by a student, enrolment or class session. Archive it instead.")
        instance.delete()

=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

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

<<<<<<< HEAD
    def destroy(self, request, *args, **kwargs):
        self.get_object()
        raise HistoryConflict("Enrolments are retained as history. Pause this enrolment instead.")

=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

class ClassSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    permission_classes = [AdminWrite]
    search_fields = ["course__name", "room", "presenter__first_name", "presenter__last_name"]
    ordering_fields = ["date", "start_time", "id"]

    def get_queryset(self):
        qs = assigned_sessions(self.request.user).select_related("course", "presenter", "assistant").prefetch_related("students")
<<<<<<< HEAD
        qs = filter_id(qs, self.request.query_params, "course")
        qs = filter_id(qs, self.request.query_params, "presenter")
        if self.request.query_params.get("status"):
            status = serializers.ChoiceField(choices=ClassSession.Status.choices).run_validation(self.request.query_params["status"])
            qs = qs.filter(status=status)
        return qs

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        lock_schedule()
=======
        return filter_id(qs, self.request.query_params, "course")

    def lock_schedule(self):
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_xact_lock(%s)", [6202027])

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        self.lock_schedule()
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        return super().create(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
<<<<<<< HEAD
        lock_schedule()
        ClassSession.objects.select_for_update().get(pk=self.get_object().pk)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self.get_object()
        return Response({"detail": "Class sessions are retained. Cancel or archive this session instead."}, status=409)

    @action(detail=True, methods=["get"], url_path="status-history")
    def status_history(self, request, pk=None):
        return Response(SessionStatusEventSerializer(self.get_object().status_events.select_related("changed_by"), many=True).data)

    def change_status(self, request, pk, status):
        if not isinstance(request.data, dict):
            raise ValidationError("Send an object with an optional reason.")
        with transaction.atomic():
            lock_schedule()
            session = self.get_object()
            session = ClassSession.objects.select_for_update().get(pk=session.pk)
            serializer = self.get_serializer(session, data={"status": status, "status_reason": request.data.get("reason", "")}, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[AdminOnly])
    def cancel(self, request, pk=None):
        return self.change_status(request, pk, ClassSession.Status.CANCELLED)

    @action(detail=True, methods=["post"], permission_classes=[AdminOnly])
    def archive(self, request, pk=None):
        return self.change_status(request, pk, ClassSession.Status.ARCHIVED)

    @action(detail=True, methods=["post"], permission_classes=[AdminOnly])
    def restore(self, request, pk=None):
        return self.change_status(request, pk, ClassSession.Status.SCHEDULED)

    @action(detail=True, methods=["get"], url_path="class-list")
    def class_list(self, request, pk=None):
        from .reports import class_list_report
        return class_list_report(request, self.get_object())

=======
        self.lock_schedule()
        ClassSession.objects.select_for_update().get(pk=self.get_object().pk)
        return super().update(request, *args, **kwargs)

>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
    @action(detail=True, methods=["get"])
    def roster(self, request, pk=None):
        session = self.get_object()
        attendance = {row.student_id: row for row in session.attendance.all()}
        return Response({"session": self.get_serializer(session).data, "students": [
            {"id": student.pk, "name": str(student), "year_level": student.year_level,
             "status": attendance[student.pk].status if student.pk in attendance else "",
<<<<<<< HEAD
             "notes": attendance[student.pk].notes if student.pk in attendance else "",
             "attendance_id": attendance[student.pk].pk if student.pk in attendance else None}
=======
             "notes": attendance[student.pk].notes if student.pk in attendance else ""}
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
            for student in session.students.order_by("last_name", "first_name")
        ]})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated], url_path="attendance")
    @transaction.atomic
    def mark_attendance(self, request, pk=None):
        session = self.get_object()
<<<<<<< HEAD
        session = ClassSession.objects.select_for_update().get(pk=session.pk)
        if session.status != ClassSession.Status.SCHEDULED:
            raise ValidationError({"session": "Attendance is read-only for cancelled or archived sessions."})
=======
        ClassSession.objects.select_for_update().get(pk=session.pk)
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
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
<<<<<<< HEAD
            session = serializer.validated_data["session"]
            session.refresh_from_db(from_queryset=ClassSession.objects.select_for_update())
=======
            ClassSession.objects.select_for_update().get(pk=serializer.validated_data["session"].pk)
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
            serializer.validate(serializer.validated_data)
            serializer.save(marked_by=self.request.user)

    def perform_update(self, serializer):
<<<<<<< HEAD
        with transaction.atomic():
            session = serializer.validated_data.get("session", serializer.instance.session)
            session.refresh_from_db(from_queryset=ClassSession.objects.select_for_update())
            serializer.validate(serializer.validated_data)
            serializer.save(marked_by=self.request.user)
=======
        serializer.save(marked_by=self.request.user)
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

    def perform_destroy(self, instance):
        if not is_admin(self.request.user):
            raise PermissionDenied("Only an admin can delete attendance history.")
<<<<<<< HEAD
        with transaction.atomic():
            session = ClassSession.objects.select_for_update().get(pk=instance.session_id)
            if session.status != ClassSession.Status.SCHEDULED:
                raise ValidationError("Attendance is read-only for cancelled or archived sessions.")
            instance.delete()
=======
        instance.delete()
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b


class ProgressNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ProgressNoteSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["student__first_name", "student__last_name", "text"]
    ordering_fields = ["date", "created_at"]

    def get_queryset(self):
        qs = ProgressNote.objects.select_related("student", "author").filter(student__in=visible_students(self.request.user))
        qs = qs.filter(Q(session__isnull=True) | Q(session__in=assigned_sessions(self.request.user)))
<<<<<<< HEAD
        deleted = serializers.BooleanField().run_validation(self.request.query_params.get("is_deleted", False))
        if self.action != "restore":
            qs = qs.filter(is_deleted=deleted)
        if deleted and not is_admin(self.request.user):
            qs = qs.filter(author=self.request.user)
        return filter_id(qs, self.request.query_params, "student")

    def save_note(self, serializer, **kwargs):
        with transaction.atomic():
            session = serializer.validated_data.get("session", getattr(serializer.instance, "session", None))
            if session:
                session.refresh_from_db(from_queryset=ClassSession.objects.select_for_update())
            if serializer.instance:
                serializer.instance = ProgressNote.objects.select_for_update().get(pk=serializer.instance.pk)
                if serializer.instance.is_deleted:
                    raise ValidationError("Restore this note before editing it.")
            serializer.validate(serializer.validated_data)
            if serializer.instance:
                self.note_event(serializer.instance, "edited")
            note = serializer.save(**kwargs)
            if "author" in kwargs:
                self.note_event(note, "created")

    def note_event(self, note, action):
        NoteEvent.objects.create(note=note, action=action, text=note.text, date=note.date, actor=self.request.user)

    def perform_create(self, serializer):
        self.save_note(serializer, author=self.request.user)

    def check_author(self, instance):
        if not is_admin(self.request.user) and instance.author_id != self.request.user.pk:
            raise PermissionDenied("You may only delete or restore notes you wrote.")

    def perform_update(self, serializer):
        if not is_admin(self.request.user) and self.request.user.role != "presenter":
            self.check_author(serializer.instance)
        self.save_note(serializer)

    def perform_destroy(self, instance):
        self.check_author(instance)
        with transaction.atomic():
            if instance.session_id:
                session = ClassSession.objects.select_for_update().get(pk=instance.session_id)
                if session.status != ClassSession.Status.SCHEDULED:
                    raise ValidationError("Notes are read-only for cancelled or archived sessions.")
            instance = ProgressNote.objects.select_for_update().get(pk=instance.pk)
            if instance.is_deleted:
                return
            self.note_event(instance, "deleted")
            instance.is_deleted = True
            instance.deleted_at = timezone.now()
            instance.deleted_by = self.request.user
            instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_at"])

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        with transaction.atomic():
            instance = self.get_object()
            self.check_author(instance)
            if instance.session_id:
                session = ClassSession.objects.select_for_update().get(pk=instance.session_id)
                if session.status != ClassSession.Status.SCHEDULED:
                    raise ValidationError("Restore the class session before restoring this note.")
            instance = ProgressNote.objects.select_for_update().get(pk=instance.pk)
            if instance.is_deleted:
                self.note_event(instance, "restored")
                instance.is_deleted = False
                instance.deleted_at = None
                instance.deleted_by = None
                instance.save(update_fields=["is_deleted", "deleted_at", "deleted_by", "updated_at"])
            return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        events = self.get_object().events.select_related("actor")
        return Response([{"id": event.pk, "action": event.action, "text": event.text, "date": event.date,
                          "actor": event.actor_id, "actor_name": str(event.actor) if event.actor else "Former staff",
                          "occurred_at": event.occurred_at} for event in events])
=======
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
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b


@api_view(["GET"])
def dashboard(request):
    students = visible_students(request.user)
    sessions = assigned_sessions(request.user)
    counts = dict(Attendance.objects.filter(session__in=sessions).values("status").annotate(total=Count("id")).values_list("status", "total"))
    return Response({"students": students.count(), "active_students": students.filter(is_active=True).count(),
                     "guardians": Guardian.objects.filter(student_links__student__in=students).distinct().count(),
<<<<<<< HEAD
                     "sessions_today": sessions.filter(date=timezone.localdate(), status=ClassSession.Status.SCHEDULED).count(),
                     "attendance": counts, "progress_notes": ProgressNote.objects.filter(student__in=students, is_deleted=False).filter(Q(session__isnull=True) | Q(session__in=sessions)).count()})
=======
                     "sessions_today": sessions.filter(date=timezone.localdate()).count(),
                     "attendance": counts, "progress_notes": ProgressNote.objects.filter(student__in=students).filter(Q(session__isnull=True) | Q(session__in=sessions)).count()})
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b


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
