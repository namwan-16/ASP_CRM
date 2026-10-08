from django.conf import settings
from django.db import models
from django.utils import timezone


class Course(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Registration(models.Model):
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="registrations")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="registrations")
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["student", "course"], name="unique_student_course")]
        ordering = ["-registered_at"]


class ClassSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="sessions")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=150)
    capacity = models.PositiveIntegerField(default=20)
    presenter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="presented_sessions")
    assistant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name="assisted_sessions", null=True, blank=True)
    students = models.ManyToManyField("students.Student", related_name="class_sessions", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "start_time", "id"]
        constraints = [
            models.CheckConstraint(condition=models.Q(end_time__gt=models.F("start_time")), name="session_end_after_start"),
            models.CheckConstraint(condition=models.Q(capacity__gte=1), name="session_positive_capacity"),
        ]

    def __str__(self):
        return f"{self.course} - {self.date}"


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LATE = "late", "Late"
        EXCUSED = "excused", "Excused"

    session = models.ForeignKey(ClassSession, on_delete=models.PROTECT, related_name="attendance")
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="attendance")
    status = models.CharField(max_length=10, choices=Status.choices)
    notes = models.TextField(blank=True)
    marked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["session", "student"], name="unique_session_attendance")]
        ordering = ["session__date", "student__last_name", "student__first_name"]


class ProgressNote(models.Model):
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="progress_notes")
    session = models.ForeignKey(ClassSession, on_delete=models.PROTECT, related_name="progress_notes", null=True, blank=True)
    text = models.TextField(max_length=10000)
    date = models.DateField(default=timezone.localdate)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
