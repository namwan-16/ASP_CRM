"""Exercise the real migration graph in isolated databases, including legacy FKs."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile

from django.test import SimpleTestCase


MIGRATION_PROBE = r'''
import os
import sys
from io import StringIO

os.environ["DJANGO_SETTINGS_MODULE"] = "config.test_settings"
from django.conf import settings
settings.DATABASES["default"]["NAME"] = sys.argv[2]
import django
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.core.management import call_command, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.db.migrations.recorder import MigrationRecorder

mode = sys.argv[1]
executor = MigrationExecutor(connection)
latest = executor.loader.graph.leaf_nodes()
legacy = [node if node[0] != "accounts" else ("accounts", "0001_initial") for node in latest]
if mode == "fresh":
    call_command("check_login_emails", stdout=StringIO())
    executor.migrate(latest)
else:
    executor.migrate(legacy)
    apps = executor.loader.project_state(legacy).apps
    OldUser = apps.get_model("accounts", "User")
    password_hash = make_password("LegacySafePass784!")
    initial_email = {"preserve": "  LEGACY@EXAMPLE.COM  ", "missing": "",
                     "inactive-missing": "", "invalid": "invalid", "duplicate": "Same@Example.com"}[mode]
    account = OldUser.objects.create(id=41, username="legacy-presenter", email=initial_email,
                                    password=password_hash, role="presenter", first_name="Legacy",
                                    is_active=mode != "inactive-missing")
    if mode == "duplicate":
        OldUser.objects.create(id=42, username="second-account", email=" same@example.com ", password=password_hash)
    if mode == "preserve":
        course = apps.get_model("classes", "Course").objects.create(name="History course")
        student = apps.get_model("students", "Student").objects.create(first_name="Ava", last_name="Example", date_of_birth="2013-01-15")
        session = apps.get_model("classes", "ClassSession").objects.create(course=course, presenter_id=41,
            date="2026-10-10", start_time="16:00", end_time="17:00", room="One")
        session.students.add(student)
        apps.get_model("classes", "ProgressNote").objects.create(student=student, session=session, author_id=41, text="Retain history")
        apps.get_model("classes", "Attendance").objects.create(student=student, session=session, marked_by_id=41, status="present")
        group = apps.get_model("auth", "Group").objects.create(name="Retain membership")
        account.groups.add(group)
        call_command("check_login_emails", stdout=StringIO())
        MigrationExecutor(connection).migrate(latest)
    else:
        audit = StringIO()
        try:
            call_command("check_login_emails", stdout=audit)
        except CommandError:
            assert "41" in audit.getvalue(), audit.getvalue()
        else:
            raise AssertionError("Audit accepted invalid legacy emails")
        assert OldUser.objects.get(pk=41).email == initial_email, "Read-only audit changed records"
        try:
            MigrationExecutor(connection).migrate(latest)
        except RuntimeError as error:
            assert "check_login_emails" in str(error)
        else:
            raise AssertionError("Migration accepted invalid legacy emails")
        assert not MigrationRecorder(connection).migration_qs.filter(app="accounts", name="0003_email_only_user").exists()
        with connection.cursor() as cursor:
            fields = [column.name for column in connection.introspection.get_table_description(cursor, "accounts_user")]
        assert "username" in fields, "Migration dropped usernames before email preflight passed"
        saved = OldUser.objects.get(pk=41)
        assert saved.username == "legacy-presenter" and saved.password == password_hash
        OldUser.objects.filter(pk=41).update(email="legacy@example.com")
        if mode == "duplicate":
            OldUser.objects.filter(pk=42).update(email="second@example.com")
        call_command("check_login_emails", stdout=StringIO())
        MigrationExecutor(connection).migrate(latest)

from accounts.models import User
with connection.cursor() as cursor:
    fields = [column.name for column in connection.introspection.get_table_description(cursor, "accounts_user")]
assert "username" not in fields
if mode == "fresh":
    root = User.objects.create_superuser("admin@example.com", "FreshSafePass784!")
    assert authenticate(email=root.email, password="FreshSafePass784!") == root
else:
    saved = User.objects.get(pk=41)
    assert saved.email == "legacy@example.com" and saved.password == password_hash and saved.role == "presenter"
    assert saved.check_password("LegacySafePass784!")
    assert saved.is_active == (mode != "inactive-missing")
    if mode == "preserve":
        from classes.models import ClassSession, ProgressNote, Attendance
        assert ClassSession.objects.get(pk=session.pk).presenter_id == 41
        assert list(ClassSession.objects.get(pk=session.pk).students.values_list("pk", flat=True)) == [student.pk]
        assert ProgressNote.objects.get().author_id == 41 and ProgressNote.objects.get().text == "Retain history"
        assert Attendance.objects.get().marked_by_id == 41 and Attendance.objects.get().status == "present"
        assert list(saved.groups.values_list("pk", flat=True)) == [group.pk]
        assert authenticate(email="LEGACY@EXAMPLE.COM", password="LegacySafePass784!").pk == 41
print("Migration probe passed:", mode)
'''


class EmailOnlyMigrationTests(SimpleTestCase):
    def run_probe(self, mode):
        backend = Path(__file__).resolve().parents[1]
        with tempfile.TemporaryDirectory(prefix="asp-email-migration-") as directory:
            result = subprocess.run(
                [sys.executable, "-c", MIGRATION_PROBE, mode, str(Path(directory) / "test.sqlite3")],
                cwd=backend, env=os.environ.copy(), capture_output=True, text=True, timeout=60,
            )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Migration probe passed", result.stdout)

    def test_fresh_install_has_no_username(self):
        self.run_probe("fresh")

    def test_migration_preserves_ids_passwords_assignments_attendance_notes_and_groups(self):
        self.run_probe("preserve")

    def test_missing_email_blocks_upgrade_until_existing_account_is_corrected(self):
        self.run_probe("missing")

    def test_inactive_accounts_also_require_email_before_username_removal(self):
        self.run_probe("inactive-missing")

    def test_invalid_email_blocks_upgrade_until_corrected(self):
        self.run_probe("invalid")

    def test_case_insensitive_duplicates_block_upgrade_until_corrected(self):
        self.run_probe("duplicate")
