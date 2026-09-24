from django.contrib import admin

from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
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
    )