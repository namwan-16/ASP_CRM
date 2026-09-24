from rest_framework import serializers

<<<<<<< HEAD
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
=======
from .models import Guardian, Student, StudentGuardian


class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class StudentGuardianSerializer(serializers.ModelSerializer):
    guardian_details = GuardianSerializer(
        source="guardian",
        read_only=True,
    )

    class Meta:
        model = StudentGuardian
        fields = (
            "id",
            "student",
            "guardian",
            "guardian_details",
            "relationship",
            "is_primary_contact",
            "is_emergency_contact",
            "created_at",
        )
        read_only_fields = ("id", "created_at")


class StudentSerializer(serializers.ModelSerializer):
    guardians = StudentGuardianSerializer(
        source="guardian_links",
        many=True,
        read_only=True,
    )

    class Meta:
        model = Student
        fields = (
            "id",
            "first_name",
            "last_name",
            "date_of_birth",
            "school",
            "year_level",
            "email",
            "phone",
            "medical_information",
            "special_circumstances",
            "guardians",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
>>>>>>> origin/tshewang
