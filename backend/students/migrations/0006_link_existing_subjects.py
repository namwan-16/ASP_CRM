from django.db import migrations


def link_subjects(apps, schema_editor):
    Student = apps.get_model("students", "Student")
    Course = apps.get_model("classes", "Course")
    database = schema_editor.connection.alias
    for name in Student.objects.using(database).exclude(subject="").values_list("subject", flat=True).distinct():
        clean = name.strip()
        if not clean:
            continue
        course = Course.objects.using(database).filter(name__iexact=clean).order_by("id").first()
        if not course:
            course = Course.objects.using(database).create(name=clean)
        Student.objects.using(database).filter(subject=name).update(subject_course=course)


class Migration(migrations.Migration):
    dependencies = [("students", "0005_student_subject_course_alter_student_subject_and_more")]
    operations = [migrations.RunPython(link_subjects, migrations.RunPython.noop)]
