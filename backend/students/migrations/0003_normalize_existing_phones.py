import re
from django.db import migrations


def normalize_existing_phones(apps, schema_editor):
    for model_name in ("Guardian", "Student"):
        model = apps.get_model("students", model_name)
        for obj in model.objects.exclude(phone="").iterator():
            phone = re.sub(r"[\s()\-.]", "", obj.phone.strip())
            if phone.startswith("+61"):
                phone = "0" + phone[3:]
            elif phone.startswith("61") and len(phone) == 11:
                phone = "0" + phone[2:]
            if re.fullmatch(r"\+?\d{7,15}", phone):
                model.objects.filter(pk=obj.pk).update(phone=phone)


class Migration(migrations.Migration):
    dependencies = [("students", "0002_student_is_active_student_permission_to_travel_alone_and_more")]
    operations = [migrations.RunPython(normalize_existing_phones, migrations.RunPython.noop)]
