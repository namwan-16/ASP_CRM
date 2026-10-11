from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from accounts.permissions import assigned_sessions, visible_students
from students.models import Student
<<<<<<< HEAD
from .models import Attendance, ClassSession, Course, ProgressNote, Registration, SessionStatusEvent


class CourseSerializer(serializers.ModelSerializer):
    can_delete = serializers.SerializerMethodField()

    def get_can_delete(self, obj):
        from config.lifecycle import course_is_used
        return not course_is_used(obj)

    def validate_name(self, value):
        value = value.strip()
        if Course.objects.filter(name__iexact=value).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError("A subject with this name already exists.")
        return value

    class Meta:
        model = Course
        fields = ("id", "name", "description", "is_active", "can_delete")
=======
from .models import Attendance, ClassSession, Course, ProgressNote, Registration


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ("id", "name", "description", "is_active")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b


class RegistrationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.__str__", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Registration
        fields = ("id", "student", "student_name", "course", "course_name", "is_active", "registered_at")
        read_only_fields = ("id", "registered_at")

    def validate(self, attrs):
        student = attrs.get("student", getattr(self.instance, "student", None))
        course = attrs.get("course", getattr(self.instance, "course", None))
<<<<<<< HEAD
        if self.instance and (student.pk != self.instance.student_id or course.pk != self.instance.course_id):
            raise serializers.ValidationError("An existing enrolment cannot be moved. Pause it and create a separate enrolment instead.")
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        if attrs.get("is_active", getattr(self.instance, "is_active", True)) and (not student.is_active or not course.is_active):
            raise serializers.ValidationError("Choose an active student and course.")
        return attrs


<<<<<<< HEAD
class SessionStatusEventSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.__str__", read_only=True, default="Former staff")

    class Meta:
        model = SessionStatusEvent
        fields = ("id", "previous_status", "status", "reason", "changed_by", "changed_by_name", "changed_at")
        read_only_fields = fields


=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
class ClassSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    presenter_name = serializers.CharField(source="presenter.__str__", read_only=True)
    assistant_name = serializers.CharField(source="assistant.__str__", read_only=True, default="")
    students = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True, required=False)
<<<<<<< HEAD
    has_history = serializers.SerializerMethodField()

    def get_has_history(self, obj):
        return obj.attendance.exists() or obj.progress_notes.exists()
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

    class Meta:
        model = ClassSession
        fields = ("id", "course", "course_name", "date", "start_time", "end_time", "room", "capacity",
<<<<<<< HEAD
                  "presenter", "presenter_name", "assistant", "assistant_name", "students", "status",
                  "status_reason", "status_changed_at", "status_changed_by", "has_history", "created_at", "updated_at")
        read_only_fields = ("id", "status_changed_at", "status_changed_by", "created_at", "updated_at")

    def validate_room(self, value):
        return " ".join(value.split())

    def validate(self, attrs):
        def value(name, default=None):
            return attrs.get(name, getattr(self.instance, name, default))
        status = value("status", ClassSession.Status.SCHEDULED)
        if self.instance and self.instance.status != ClassSession.Status.SCHEDULED:
            if status != ClassSession.Status.SCHEDULED and set(attrs) - {"status", "status_reason"}:
                raise serializers.ValidationError("Restore this session before changing its schedule or roster.")
        # Closing a session must work even when its staff/course/students were deactivated.
        if self.instance and status != ClassSession.Status.SCHEDULED and not set(attrs) - {"status", "status_reason"}:
            return attrs
        if value("end_time") <= value("start_time"):
            raise serializers.ValidationError({"end_time": "End time must be later than start time."})
        capacity = value("capacity", 20)
=======
                  "presenter", "presenter_name", "assistant", "assistant_name", "students", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        def value(name):
            return attrs.get(name, getattr(self.instance, name, None))
        if value("end_time") <= value("start_time"):
            raise serializers.ValidationError({"end_time": "End time must be later than start time."})
        capacity = attrs.get("capacity", getattr(self.instance, "capacity", 20))
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        students = attrs.get("students", list(self.instance.students.all()) if self.instance else [])
        if capacity < 1 or len(students) > capacity:
            raise serializers.ValidationError({"capacity": "Capacity must be positive and fit the roster."})
        if len({student.pk for student in students}) != len(students):
            raise serializers.ValidationError({"students": "The roster contains duplicate students."})
<<<<<<< HEAD
        previous_ids = set(self.instance.students.values_list("pk", flat=True)) if self.instance else set()
        if any(not student.is_active and student.pk not in previous_ids for student in students):
            raise serializers.ValidationError({"students": "Inactive students cannot be newly assigned."})
        presenter, assistant = value("presenter"), value("assistant")
        if not presenter.is_active or (not presenter.is_superuser and presenter.role not in ("presenter", "admin")):
            raise serializers.ValidationError({"presenter": "Choose an active presenter or admin."})
        if assistant and (not assistant.is_active or (not assistant.is_superuser and assistant.role not in ("assistant", "admin"))):
            raise serializers.ValidationError({"assistant": "Choose an active assistant or admin."})
        if assistant == presenter:
            raise serializers.ValidationError({"assistant": "Presenter and assistant must be different people."})
        if not value("course").is_active and (not self.instance or value("course").pk != self.instance.course_id
                                              or self.instance.status != ClassSession.Status.SCHEDULED):
            raise serializers.ValidationError({"course": "Choose an active course."})
=======
        if any(not student.is_active for student in students):
            raise serializers.ValidationError({"students": "Inactive students cannot be assigned."})
        presenter, assistant = value("presenter"), value("assistant")
        if not presenter.is_active or presenter.role not in ("presenter", "admin"):
            raise serializers.ValidationError({"presenter": "Choose an active presenter or admin."})
        if assistant and (not assistant.is_active or assistant.role not in ("assistant", "admin")):
            raise serializers.ValidationError({"assistant": "Choose an active assistant or admin."})
        if assistant == presenter:
            raise serializers.ValidationError({"assistant": "Presenter and assistant must be different people."})
        if not value("course").is_active:
            raise serializers.ValidationError({"course": "Choose an active course."})
        overlaps = ClassSession.objects.filter(date=value("date"), start_time__lt=value("end_time"), end_time__gt=value("start_time")).exclude(pk=getattr(self.instance, "pk", None))
        staff = [user for user in (presenter, assistant) if user]
        if overlaps.filter(Q(room__iexact=value("room")) | Q(presenter__in=staff) | Q(assistant__in=staff)).exists():
            raise serializers.ValidationError("The room or staff are already assigned at this time.")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        if self.instance:
            recorded = set(self.instance.attendance.values_list("student_id", flat=True)) | set(self.instance.progress_notes.values_list("student_id", flat=True))
            if not recorded.issubset({student.pk for student in students}):
                raise serializers.ValidationError({"students": "Students with attendance or note history cannot be removed."})
<<<<<<< HEAD
            if recorded:
                for name in ("course", "date", "start_time", "end_time", "room"):
                    if name in attrs and attrs[name] != getattr(self.instance, name):
                        raise serializers.ValidationError({name: "A session with recorded history cannot be moved. Cancel/archive it and create a new session."})
        if status == ClassSession.Status.SCHEDULED:
            overlaps = ClassSession.objects.filter(status=ClassSession.Status.SCHEDULED, date=value("date"),
                start_time__lt=value("end_time"), end_time__gt=value("start_time")).exclude(pk=getattr(self.instance, "pk", None))
            staff = [user for user in (presenter, assistant) if user]
            conflicts = overlaps.filter(Q(room__iexact=value("room")) | Q(presenter__in=staff) |
                                       Q(assistant__in=staff) | Q(students__in=students)).select_related("course").distinct()
            messages = []
            for session in conflicts:
                reasons = []
                if session.room.strip().casefold() == value("room").strip().casefold():
                    reasons.append("room already booked")
                if session.presenter_id in [u.pk for u in staff] or session.assistant_id in [u.pk for u in staff]:
                    reasons.append("presenter/assistant already assigned")
                if session.students.filter(pk__in=[s.pk for s in students]).exists():
                    reasons.append("student already scheduled")
                messages.append(f"Session {session.pk}: {session.course.name}, {session.start_time:%H:%M}–{session.end_time:%H:%M}: {', '.join(reasons)}.")
            if messages:
                raise serializers.ValidationError({"schedule": messages})
        return attrs

    def register_students(self, session, only_ids=None):
        if session.status == ClassSession.Status.SCHEDULED:
            students = session.students.filter(is_active=True)
            if only_ids is not None:
                students = students.filter(pk__in=only_ids)
            for student in students:
                Registration.objects.update_or_create(student=student, course=session.course, defaults={"is_active": True})

    def record_status(self, session, previous_status):
        if previous_status != session.status:
            request = self.context.get("request")
            session.status_changed_at = timezone.now()
            session.status_changed_by = request.user if request else None
            session.save(update_fields=["status_changed_at", "status_changed_by"])
            SessionStatusEvent.objects.create(session=session, previous_status=previous_status,
                status=session.status, reason=session.status_reason, changed_by=session.status_changed_by)
=======
            if ("course" in attrs and attrs["course"] != self.instance.course) and recorded:
                raise serializers.ValidationError({"course": "A session with history cannot change course."})
        return attrs

    def register_students(self, session):
        for student in session.students.all():
            Registration.objects.update_or_create(student=student, course=session.course, defaults={"is_active": True})
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

    @transaction.atomic
    def create(self, validated_data):
        session = super().create(validated_data)
<<<<<<< HEAD
        self.record_status(session, "")
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        self.register_students(session)
        return session

    @transaction.atomic
    def update(self, instance, validated_data):
<<<<<<< HEAD
        previous_status = instance.status
        previous_course_id = instance.course_id
        previous_ids = set(instance.students.values_list("pk", flat=True))
        if "status" in validated_data and validated_data["status"] != previous_status:
            validated_data.setdefault("status_reason", "")
        instance = super().update(instance, validated_data)
        self.record_status(instance, previous_status)
        newly_assigned = set(instance.students.values_list("pk", flat=True)) - previous_ids
        if previous_status != instance.status or previous_course_id != instance.course_id:
            self.register_students(instance)
        else:
            self.register_students(instance, only_ids=newly_assigned)
=======
        instance = super().update(instance, validated_data)
        self.register_students(instance)
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        return instance


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.__str__", read_only=True)
    marked_by_name = serializers.CharField(source="marked_by.__str__", read_only=True)
    session_date = serializers.DateField(source="session.date", read_only=True)
    course_name = serializers.CharField(source="session.course.name", read_only=True)

    class Meta:
        model = Attendance
        fields = ("id", "session", "student", "student_name", "session_date", "course_name", "status", "notes", "marked_by", "marked_by_name", "updated_at")
        read_only_fields = ("id", "marked_by", "updated_at")
        validators = []

    def validate(self, attrs):
        session = attrs.get("session", getattr(self.instance, "session", None))
        student = attrs.get("student", getattr(self.instance, "student", None))
        if not assigned_sessions(self.context["request"].user).filter(pk=session.pk).exists():
            raise PermissionDenied("You are not assigned to this class.")
<<<<<<< HEAD
        if session.status != ClassSession.Status.SCHEDULED:
            raise serializers.ValidationError({"session": "Attendance is read-only for cancelled or archived sessions. Restore the session to make corrections."})
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        if not session.students.filter(pk=student.pk).exists():
            raise serializers.ValidationError({"student": "This student is not on the session roster."})
        if self.instance and (session.pk != self.instance.session_id or student.pk != self.instance.student_id):
            raise serializers.ValidationError("The session and student of recorded attendance cannot change.")
        if not self.instance and Attendance.objects.filter(session=session, student=student).exists():
            raise serializers.ValidationError("Attendance already exists. Update it or use bulk attendance.")
        return attrs


class ProgressNoteSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.__str__", read_only=True)
    author_name = serializers.CharField(source="author.__str__", read_only=True)

    class Meta:
        model = ProgressNote
<<<<<<< HEAD
        fields = ("id", "student", "student_name", "session", "text", "date", "author", "author_name", "is_deleted", "deleted_at", "deleted_by", "created_at", "updated_at")
        read_only_fields = ("id", "author", "is_deleted", "deleted_at", "deleted_by", "created_at", "updated_at")
=======
        fields = ("id", "student", "student_name", "session", "text", "date", "author", "author_name", "created_at", "updated_at")
        read_only_fields = ("id", "author", "created_at", "updated_at")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

    def validate(self, attrs):
        user = self.context["request"].user
        student = attrs.get("student", getattr(self.instance, "student", None))
        session = attrs.get("session", getattr(self.instance, "session", None))
<<<<<<< HEAD
        if self.instance and (student.pk != self.instance.student_id or getattr(session, "pk", None) != self.instance.session_id):
            raise serializers.ValidationError("The student/session of a recorded note cannot change.")
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        if not visible_students(user).filter(pk=student.pk).exists():
            raise PermissionDenied("You cannot access this student.")
        if session:
            if not assigned_sessions(user).filter(pk=session.pk).exists():
                raise PermissionDenied("You are not assigned to this class.")
<<<<<<< HEAD
            if session.status != ClassSession.Status.SCHEDULED:
                raise serializers.ValidationError({"session": "Notes are read-only for cancelled or archived sessions."})
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
            if not session.students.filter(pk=student.pk).exists():
                raise serializers.ValidationError({"student": "This student is not on the session roster."})
        if attrs.get("date", getattr(self.instance, "date", timezone.localdate())) > timezone.localdate():
            raise serializers.ValidationError({"date": "Progress notes cannot be dated in the future."})
        return attrs
