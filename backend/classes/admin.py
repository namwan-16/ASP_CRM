from django import forms
from django.contrib import admin
from django.db import transaction
from rest_framework.exceptions import ValidationError
from config.admin import AdminManagedModelAdmin

from .models import Attendance, ClassSession, Course, NoteEvent, ProgressNote, Registration, SessionStatusEvent
from .scheduling import lock_schedule
from .serializers import ClassSessionSerializer


class ClassSessionAdminForm(forms.ModelForm):
    class Meta:
        model = ClassSession
        fields = "__all__"

    def clean(self):
        data = super().clean()
        required = ("course", "date", "start_time", "end_time", "room", "presenter")
        if self.errors or any(data.get(key) is None for key in required):
            return data
        data["room"] = " ".join(data["room"].split())
        attrs = {key: value for key, value in data.items() if key in ClassSessionSerializer.Meta.fields}
        if "students" in attrs:
            attrs["students"] = list(attrs["students"])
        original = ClassSession.objects.get(pk=self.instance.pk) if self.instance.pk else None
        if original:
            attrs = {key: value for key, value in attrs.items()
                     if (set(s.pk for s in value) != set(original.students.values_list("pk", flat=True)) if key == "students" else value != getattr(original, key))}
        try:
            ClassSessionSerializer(instance=original).validate(attrs)
        except ValidationError as exc:
            raise forms.ValidationError(str(exc.detail))
        return data


@admin.register(ClassSession)
class ClassSessionAdmin(AdminManagedModelAdmin):
    form = ClassSessionAdminForm
    list_display = ("course", "date", "start_time", "room", "presenter", "assistant", "status")
    list_filter = ("status", "date", "course")
    filter_horizontal = ("students",)
    readonly_fields = ("status_changed_at", "status_changed_by")

    @transaction.atomic
    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        if request.method == "POST":
            lock_schedule()
            if object_id:
                list(ClassSession.objects.select_for_update().filter(pk=object_id))
        return super().changeform_view(request, object_id, form_url, extra_context)

    def save_model(self, request, obj, form, change):
        previous = ClassSession.objects.get(pk=obj.pk).status if change else ""
        super().save_model(request, obj, form, change)
        ClassSessionSerializer(context={"request": request}).record_status(obj, previous)

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "student", "status", "marked_by", "updated_at")
    list_filter = ("status", "session__date")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ProgressNote)
class ProgressNoteAdmin(AttendanceAdmin):
    list_display = ("student", "date", "author")
    list_filter = ("date",)
    search_fields = ("student__first_name", "student__last_name", "text")


@admin.register(SessionStatusEvent)
class SessionStatusEventAdmin(AttendanceAdmin):
    list_display = ("session", "previous_status", "status", "changed_by", "changed_at")
    list_filter = ("status",)


@admin.register(NoteEvent)
class NoteEventAdmin(AttendanceAdmin):
    list_display = ("note", "action", "actor", "occurred_at")
    list_filter = ("action",)


@admin.register(Registration)
class RegistrationAdmin(AdminManagedModelAdmin):
    list_display = ("student", "course", "is_active", "registered_at")

    def has_delete_permission(self, request, obj=None):
        return False

    def get_readonly_fields(self, request, obj=None):
        return ("student", "course", "registered_at") if obj else ("registered_at",)


admin.site.register(Course, AdminManagedModelAdmin)
