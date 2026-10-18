from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower, Trim

from .managers import UserManager


class User(AbstractUser):
    username = None
    email = models.EmailField("email address", unique=True)
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        PRESENTER = "presenter", "Presenter"
        ASSISTANT = "assistant", "Assistant"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ASSISTANT,
    )

    class Meta(AbstractUser.Meta):
        constraints = [
            models.UniqueConstraint(
                Lower(Trim("email")), condition=~models.Q(email=""),
                name="accounts_unique_login_email",
            ),
            models.CheckConstraint(
                condition=~models.Q(email=""), name="accounts_login_email_required",
            ),
        ]

    def save(self, *args, **kwargs):
        self.email = type(self).objects.normalize_email(self.email)
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.get_full_name() or self.email

