from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        PRESENTER = "presenter", "Presenter"
        ASSISTANT = "assistant", "Assistant"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ASSISTANT,
    )

    def __str__(self):
        return self.get_full_name() or self.username

