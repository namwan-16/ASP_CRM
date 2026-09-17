from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('PRESENTER', 'Presenter'),
        ('ASSISTANT', 'Assistant'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='ASSISTANT'
    )

    phone_number = models.CharField(
        max_length=20,
        blank=True
    )

    def __str__(self):
        return self.username