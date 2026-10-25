from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from django.db import connection
from django.db.models import Count
from django.db.models.functions import Lower, Trim

from accounts.models import User


class Command(BaseCommand):
    help = "Check every account for duplicate, missing or invalid email without changing records; works before the email-only migration."

    def handle(self, *args, **options):
        if User._meta.db_table not in connection.introspection.table_names():
            self.stdout.write(self.style.SUCCESS("No account table yet. Run migrate, then createsuperuser."))
            return
        users = User.objects.annotate(login_email=Lower(Trim("email")))
        duplicates = users.exclude(login_email="").values("login_email").annotate(total=Count("id")).filter(total__gt=1)
        problems = False
        for duplicate in duplicates:
            ids = list(users.filter(login_email=duplicate["login_email"]).values_list("id", flat=True))
            self.stdout.write(self.style.ERROR(f"Duplicate email {duplicate['login_email']} on account IDs {ids}."))
            problems = True
        for user in users.order_by("pk"):
            problem = "missing email" if not user.login_email else ""
            if user.login_email:
                try:
                    validate_email(user.login_email)
                except ValidationError:
                    problem = "invalid email"
            if problem:
                state = "active" if user.is_active else "inactive"
                self.stdout.write(self.style.ERROR(f"Account ID {user.pk} ({state}): {problem}."))
                problems = True
        if problems:
            raise CommandError("Give ALL listed accounts valid, distinct emails before migrating. See docs/EMAIL_LOGIN.md. No records were changed.")
        self.stdout.write(self.style.SUCCESS("All accounts have valid, unique emails. No records were changed."))
