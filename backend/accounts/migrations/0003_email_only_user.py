from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import migrations, models

import accounts.managers


def require_valid_account_emails(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    accounts = User.objects.using(schema_editor.connection.alias)
    invalid_ids = []
    for account in accounts.only("id", "email").iterator():
        try:
            validate_email(account.email)
        except ValidationError:
            invalid_ids.append(account.pk)
    if invalid_ids:
        raise RuntimeError(
            f"Cannot remove usernames: account IDs {invalid_ids} have missing or invalid emails. "
            "Run 'python manage.py check_login_emails', set valid emails on those existing IDs, and retry migrate. "
            "No accounts are deleted or recreated. See docs/EMAIL_LOGIN.md."
        )


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_unique_login_email")]

    operations = [
        migrations.RunPython(require_valid_account_emails, migrations.RunPython.noop),
        migrations.AlterModelManagers(
            name="user", managers=[("objects", accounts.managers.UserManager())],
        ),
        migrations.AlterField(
            model_name="user", name="email",
            field=models.EmailField(max_length=254, unique=True, verbose_name="email address"),
        ),
        migrations.RemoveField(model_name="user", name="username"),
        migrations.AddConstraint(
            model_name="user", constraint=models.CheckConstraint(
                condition=~models.Q(email=""), name="accounts_login_email_required",
            ),
        ),
        # Dropped usernames cannot be reconstructed. Restore a database backup
        # with the previous source if reverting this upgrade is necessary.
        migrations.RunPython(migrations.RunPython.noop),
    ]
