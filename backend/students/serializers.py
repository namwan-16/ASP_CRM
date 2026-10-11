import re

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Guardian, Student, StudentGuardian


def normalize_phone(value):
    value = re.sub(r"[\s()\-.]", "", str(value).strip())
    if not re.fullmatch(r"\+?\d{7,15}", value):
        raise serializers.ValidationError("Enter a phone number with 7 to 15 digits.")
    if value.startswith("+61"):
        value = "0" + value[3:]
    elif value.startswith("61") and len(value) == 11:
        value = "0" + value[2:]
    return value


class GuardianContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ("id", "first_name", "last_name", "email", "phone")


class GuardianLinkInput(serializers.Serializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all())
    relationship = serializers.CharField(max_length=50)
    is_primary_contact = serializers.BooleanField(default=False)
    is_emergency_contact = serializers.BooleanField(default=True)


class GuardianSerializer(serializers.ModelSerializer):
    students = serializers.SerializerMethodField()
<<<<<<< HEAD
    can_delete = serializers.SerializerMethodField()
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
    links = GuardianLinkInput(many=True, write_only=True, required=False)

    class Meta:
        model = Guardian
<<<<<<< HEAD
        fields = ("id", "first_name", "last_name", "email", "phone", "students", "links", "can_delete", "created_at", "updated_at")
=======
        fields = ("id", "first_name", "last_name", "email", "phone", "students", "links", "created_at", "updated_at")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_phone(self, value):
        return normalize_phone(value)

<<<<<<< HEAD
    def get_can_delete(self, obj):
        return not obj.student_links.exists()

=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
    def validate_links(self, value):
        if len({link["student"].pk for link in value}) != len(value):
            raise serializers.ValidationError("A student can only be linked once.")
        return value

    def get_students(self, obj):
        links = obj.student_links.all()
        request = self.context.get("request")
        if request:
            from accounts.permissions import is_admin, visible_students
            if not is_admin(request.user):
                if "visible_student_ids" not in self.context:
                    self.context["visible_student_ids"] = set(visible_students(request.user).values_list("pk", flat=True))
                allowed = self.context["visible_student_ids"]
                links = [link for link in links if link.student_id in allowed]
        return [dict(id=link.pk, student=link.student_id, name=str(link.student), relationship=link.relationship,
                     is_primary_contact=link.is_primary_contact, is_emergency_contact=link.is_emergency_contact) for link in links]

    def save_links(self, guardian, links):
        if links is None:
            return
<<<<<<< HEAD
        ids = set(guardian.student_links.values_list("student_id", flat=True)) | {link["student"].pk for link in links}
        list(Student.objects.select_for_update().filter(pk__in=ids).order_by("pk"))
=======
        list(Student.objects.select_for_update().filter(pk__in=[link["student"].pk for link in links]).order_by("pk"))
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        for link in links:
            if link.get("is_primary_contact") and StudentGuardian.objects.filter(
                student=link["student"], is_primary_contact=True
            ).exclude(guardian=guardian).exists():
                raise serializers.ValidationError({"links": f"{link['student']} already has a primary contact."})
        guardian.student_links.exclude(student__in=[link["student"] for link in links]).delete()
        for link in links:
            student = link.pop("student")
            StudentGuardian.objects.update_or_create(student=student, guardian=guardian, defaults=link)

    @transaction.atomic
    def create(self, validated_data):
        links = validated_data.pop("links", None)
        guardian = super().create(validated_data)
        self.save_links(guardian, links)
        return guardian

    @transaction.atomic
    def update(self, instance, validated_data):
        links = validated_data.pop("links", None)
        guardian = super().update(instance, validated_data)
        self.save_links(guardian, links)
        return guardian


class StudentGuardianSerializer(serializers.ModelSerializer):
    guardian_details = GuardianContactSerializer(source="guardian", read_only=True)

    class Meta:
        model = StudentGuardian
        fields = ("id", "student", "guardian", "guardian_details", "relationship", "is_primary_contact", "is_emergency_contact", "created_at")
        read_only_fields = ("id", "created_at")

    def validate(self, attrs):
        student = attrs.get("student", getattr(self.instance, "student", None))
        primary = attrs.get("is_primary_contact", getattr(self.instance, "is_primary_contact", False))
        if primary and StudentGuardian.objects.filter(student=student, is_primary_contact=True).exclude(pk=getattr(self.instance, "pk", None)).exists():
            raise serializers.ValidationError({"is_primary_contact": "This student already has a primary contact."})
        return attrs


class StudentSerializer(serializers.ModelSerializer):
<<<<<<< HEAD
    from classes.models import Course
    subject_id = serializers.PrimaryKeyRelatedField(source="subject_course", queryset=Course.objects.all(),
                                                   required=False, allow_null=True)
    can_delete = serializers.SerializerMethodField()
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
    guardians = StudentGuardianSerializer(source="guardian_links", many=True, read_only=True)
    guardian_id = serializers.PrimaryKeyRelatedField(queryset=Guardian.objects.all(), write_only=True, required=False, allow_null=True)
    guardian_relationship = serializers.CharField(write_only=True, required=False, default="Guardian", max_length=50)

    class Meta:
        model = Student
        fields = ("id", "first_name", "last_name", "date_of_birth", "school", "year_level", "email", "phone", "subject",
                  "permission_to_travel_alone", "is_active", "medical_information", "special_circumstances", "guardians",
<<<<<<< HEAD
                  "guardian_id", "guardian_relationship", "subject_id", "can_delete", "created_at", "updated_at")
=======
                  "guardian_id", "guardian_relationship", "created_at", "updated_at")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_date_of_birth(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        return value

    def validate_phone(self, value):
        return normalize_phone(value) if value else value

<<<<<<< HEAD
    def get_can_delete(self, obj):
        from config.lifecycle import student_has_history
        return not student_has_history(obj)

    def validate(self, attrs):
        from classes.models import Course
        if "subject_course" in attrs:
            course = attrs["subject_course"]
            if course and not course.is_active and getattr(self.instance, "subject_course_id", None) != course.pk:
                raise serializers.ValidationError({"subject_id": "Choose an active subject."})
            attrs["subject"] = course.name if course else ""
        elif "subject" in attrs:
            name = attrs["subject"].strip()
            course = Course.objects.filter(name__iexact=name).first() if name else None
            unchanged = self.instance and name == self.instance.subject
            if name and unchanged and self.instance.subject_course_id:
                # Older clients/imports may still send the pre-rename text.
                course = self.instance.subject_course
            if name and not unchanged and (not course or not course.is_active):
                raise serializers.ValidationError({"subject": "Choose an active subject from the Subjects page."})
            attrs["subject_course"] = course
            attrs["subject"] = course.name if course else name
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.subject_course_id:
            data["subject"] = instance.subject_course.name
        return data

=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
    def save_guardian(self, student, guardian, relationship):
        if guardian:
            StudentGuardian.objects.filter(student=student, is_primary_contact=True).update(is_primary_contact=False)
            StudentGuardian.objects.update_or_create(student=student, guardian=guardian, defaults={
                "relationship": relationship, "is_primary_contact": True, "is_emergency_contact": True,
            })

    @transaction.atomic
    def create(self, validated_data):
        guardian = validated_data.pop("guardian_id", None)
        relationship = validated_data.pop("guardian_relationship", "Guardian")
        student = super().create(validated_data)
        self.save_guardian(student, guardian, relationship)
        return student

    @transaction.atomic
    def update(self, instance, validated_data):
        Student.objects.select_for_update().get(pk=instance.pk)
        clear_primary = "guardian_id" in validated_data and validated_data["guardian_id"] is None
        guardian = validated_data.pop("guardian_id", None)
        relationship = validated_data.pop("guardian_relationship", "Guardian")
        student = super().update(instance, validated_data)
        if clear_primary:
            StudentGuardian.objects.filter(student=student, is_primary_contact=True).update(is_primary_contact=False)
        self.save_guardian(student, guardian, relationship)
        return student
<<<<<<< HEAD


class EmergencyStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ("id", "first_name", "last_name", "year_level", "is_active")
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
