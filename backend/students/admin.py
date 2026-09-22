from django.contrib import admin

from .models import Guardian, Student, StudentGuardian


class StudentGuardianInline(admin.TabularInline):
    model = StudentGuardian
    extra = 1


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
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


@admin.register(Guardian)
class GuardianAdmin(admin.ModelAdmin):
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
class StudentGuardianAdmin(admin.ModelAdmin):
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