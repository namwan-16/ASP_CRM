from rest_framework import serializers

from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student

        fields = (
            "id",
            "phone_number",
            "first_name",
            "last_name",
            "email",
            "date_of_birth",
            "school",
            "year_level",
            "guardian_name",
            "guardian_phone",
            "address",
            "notes",
            "is_active",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields