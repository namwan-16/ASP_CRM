from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from accounts.permissions import assigned_sessions, visible_students
from students.models import Student
from .models import Attendance, ClassSession, Course, ProgressNote, Registration


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ("id", "name", "description", "is_active")


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
        if attrs.get("is_active", getattr(self.instance, "is_active", True)) and (not student.is_active or not course.is_active):
            raise serializers.ValidationError("Choose an active student and course.")
        return attrs


class ClassSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    presenter_name = serializers.CharField(source="presenter.__str__", read_only=True)
    assistant_name = serializers.CharField(source="assistant.__str__", read_only=True, default="")
    students = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), many=True, required=False)

    class Meta:
        model = ClassSession
        fields = ("id", "course", "course_name", "date", "start_time", "end_time", "room", "capacity",
                  "presenter", "presenter_name", "assistant", "assistant_name", "students", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        def value(name):
            return attrs.get(name, getattr(self.instance, name, None))
        if value("end_time") <= value("start_time"):
            raise serializers.ValidationError({"end_time": "End time must be later than start time."})
        capacity = attrs.get("capacity", getattr(self.instance, "capacity", 20))
        students = attrs.get("students", list(self.instance.students.all()) if self.instance else [])
        if capacity < 1 or len(students) > capacity:
            raise serializers.ValidationError({"capacity": "Capacity must be positive and fit the roster."})
        if len({student.pk for student in students}) != len(students):
            raise serializers.ValidationError({"students": "The roster contains duplicate students."})
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
        if self.instance:
            recorded = set(self.instance.attendance.values_list("student_id", flat=True)) | set(self.instance.progress_notes.values_list("student_id", flat=True))
            if not recorded.issubset({student.pk for student in students}):
                raise serializers.ValidationError({"students": "Students with attendance or note history cannot be removed."})
            if ("course" in attrs and attrs["course"] != self.instance.course) and recorded:
                raise serializers.ValidationError({"course": "A session with history cannot change course."})
        return attrs

    def register_students(self, session):
        for student in session.students.all():
            Registration.objects.update_or_create(student=student, course=session.course, defaults={"is_active": True})

    @transaction.atomic
    def create(self, validated_data):
        session = super().create(validated_data)
        self.register_students(session)
        return session

    @transaction.atomic
    def update(self, instance, validated_data):
        instance = super().update(instance, validated_data)
        self.register_students(instance)
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
        fields = ("id", "student", "student_name", "session", "text", "date", "author", "author_name", "created_at", "updated_at")
        read_only_fields = ("id", "author", "created_at", "updated_at")

    def validate(self, attrs):
        user = self.context["request"].user
        student = attrs.get("student", getattr(self.instance, "student", None))
        session = attrs.get("session", getattr(self.instance, "session", None))
        if not visible_students(user).filter(pk=student.pk).exists():
            raise PermissionDenied("You cannot access this student.")
        if session:
            if not assigned_sessions(user).filter(pk=session.pk).exists():
                raise PermissionDenied("You are not assigned to this class.")
            if not session.students.filter(pk=student.pk).exists():
                raise serializers.ValidationError({"student": "This student is not on the session roster."})
        if attrs.get("date", getattr(self.instance, "date", timezone.localdate())) > timezone.localdate():
            raise serializers.ValidationError({"date": "Progress notes cannot be dated in the future."})
        return attrs
