from django.db import models


<<<<<<< HEAD

class Student(models.Model):
    phone_number = models.CharField(max_length=32, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    school = models.CharField(max_length=200, blank=True)
    year_level = models.CharField(max_length=50, blank=True)
    guardian_name = models.CharField(max_length=200, blank=True)
    guardian_phone = models.CharField(max_length=32, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
=======
class Student(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    school = models.CharField(max_length=200, blank=True)
    year_level = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)

    medical_information = models.TextField(blank=True)
    special_circumstances = models.TextField(blank=True)
>>>>>>> origin/tshewang

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

<<<<<<< HEAD
    class Meta:
        ordering = ("last_name", "first_name")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone_number})"
=======
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
            )
        ]

    def __str__(self):
        return (
            f"{self.student} - {self.guardian} "
            f"({self.relationship})"
        )
>>>>>>> origin/tshewang
