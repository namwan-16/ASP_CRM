from django.db import models


class Student(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    school = models.CharField(max_length=200, blank=True)
    year_level = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    subject = models.CharField(max_length=100, blank=True)
    permission_to_travel_alone = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    medical_information = models.TextField(blank=True)
    special_circumstances = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Guardian(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class StudentGuardian(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="guardian_links",
    )

    guardian = models.ForeignKey(
        Guardian,
        on_delete=models.CASCADE,
        related_name="student_links",
    )

    relationship = models.CharField(max_length=50)

    is_primary_contact = models.BooleanField(default=False)
    is_emergency_contact = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "guardian"],
                name="unique_student_guardian",
            ),
            models.UniqueConstraint(
                fields=["student"], condition=models.Q(is_primary_contact=True),
                name="unique_primary_guardian",
            ),
        ]

    def __str__(self):
        return (
            f"{self.student} - {self.guardian} "
            f"({self.relationship})"
        )
