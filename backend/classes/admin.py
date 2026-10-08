from django.contrib import admin
from .models import Attendance, ClassSession, Course, ProgressNote, Registration


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ("course", "date", "start_time", "room", "presenter", "assistant")
    list_filter = ("date", "course")
    filter_horizontal = ("students",)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "student", "status", "marked_by", "updated_at")
    list_filter = ("status", "session__date")


@admin.register(ProgressNote)
class ProgressNoteAdmin(admin.ModelAdmin):
    list_display = ("student", "date", "author")
    search_fields = ("student__first_name", "student__last_name", "text")


admin.site.register(Course)
admin.site.register(Registration)
