from django.db import migrations, models
from django.db.models.functions import Lower, Trim


def normalize_existing_emails(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    users = User.objects.using(schema_editor.connection.alias)
    duplicate_emails = users.annotate(login_email=Lower(Trim("email"))).exclude(login_email="") \
        .values("login_email").annotate(total=models.Count("id")).filter(total__gt=1)
    if duplicate_emails.exists():
        raise RuntimeError(
            "Multiple accounts share the same email address. Run 'python manage.py check_login_emails' "
            "and give those accounts separate email addresses before retrying migrate. No accounts are merged or deleted."
        )
    users.update(email=Lower(Trim("email")))


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [
        migrations.RunPython(normalize_existing_emails, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(
                Lower(Trim("email")), condition=~models.Q(email=""),
                name="accounts_unique_login_email",
            ),
        ),
    ]
