from django.db import migrations, models
from django.db.models import Count


def check_primary_contacts(apps, schema_editor):
    links = apps.get_model("students", "StudentGuardian")
    if links.objects.filter(is_primary_contact=True).values("student").annotate(total=Count("id")).filter(total__gt=1).exists():
        raise RuntimeError("Some students have multiple primary guardians. Keep one primary per student in the old database and rerun migrate.")


class Migration(migrations.Migration):
    dependencies = [("students", "0003_normalize_existing_phones")]
    operations = [
        migrations.RunPython(check_primary_contacts, migrations.RunPython.noop),
        migrations.AddConstraint(model_name="studentguardian", constraint=models.UniqueConstraint(
            fields=("student",), condition=models.Q(is_primary_contact=True), name="unique_primary_guardian",
        )),
    ]
