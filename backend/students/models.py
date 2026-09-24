from django.db import models



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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("last_name", "first_name")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone_number})"