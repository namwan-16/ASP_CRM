from django.contrib import admin

<<<<<<< HEAD
from .models import Student
=======
from .models import Guardian, Student, StudentGuardian


class StudentGuardianInline(admin.TabularInline):
    model = StudentGuardian
    extra = 1
>>>>>>> origin/tshewang


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
<<<<<<< HEAD
        "first_name",
        "last_name",
        "phone_number",
        "school",
        "year_level",
        "is_active",
        "updated_at",
    )

    list_filter = (
        "is_active",
        "school",
        "year_level",
    )

    search_fields = (
        "first_name",
        "last_name",
        "phone_number",
        "email",
        "guardian_name",
=======
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
>>>>>>> origin/tshewang
    )