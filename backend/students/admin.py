from django.contrib import admin
from django.core.exceptions import PermissionDenied
from accounts.permissions import is_admin
from config.lifecycle import student_has_history
from config.admin import AdminManagedModelAdmin

from .models import Guardian, Student, StudentGuardian


class StudentGuardianInline(admin.TabularInline):
    model = StudentGuardian
    extra = 1


@admin.register(Student)
class StudentAdmin(AdminManagedModelAdmin):
    list_display = (
        "id",
        "first_name",
        "last_name",
        "school",
        "year_level",
    )
    search_fields = (
        "first_name",
        "last_name",
        "school",
        "email",
    )
    inlines = [StudentGuardianInline]

    def has_delete_permission(self, request, obj=None):
        return bool(obj and is_admin(request.user) and not student_has_history(obj)
                    and super().has_delete_permission(request, obj))

    def delete_model(self, request, obj):
        if student_has_history(obj):
            raise PermissionDenied("Deactivate students with protected history instead.")
        super().delete_model(request, obj)

    def get_actions(self, request):
        actions = super().get_actions(request)
        actions.pop("delete_selected", None)
        return actions


@admin.register(Guardian)
class GuardianAdmin(AdminManagedModelAdmin):
    list_display = (
        "id",
        "first_name",
        "last_name",
        "phone",
        "email",
    )
    search_fields = (
        "first_name",
        "last_name",
        "phone",
        "email",
    )


@admin.register(StudentGuardian)
class StudentGuardianAdmin(AdminManagedModelAdmin):
    list_display = (
        "student",
        "guardian",
        "relationship",
        "is_primary_contact",
        "is_emergency_contact",
    )
    list_filter = (
        "is_primary_contact",
        "is_emergency_contact",
    )
