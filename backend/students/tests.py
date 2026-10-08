import csv
import io
from datetime import date

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from openpyxl import Workbook
from rest_framework.test import APITestCase

from accounts.models import User
from classes.models import ClassSession, Course
from .imports import HEADERS
from .models import Guardian, Student, StudentGuardian


class StudentApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin", role="admin")
        self.assistant = User.objects.create_user("assistant")
        self.client.force_authenticate(self.admin)

    def student(self, **values):
        return Student.objects.create(first_name=values.pop("first_name", "Ava"), last_name="Example", date_of_birth="2013-01-15", **values)

    def test_crud_persists_student_and_guardian_link(self):
        guardian = self.client.post("/api/guardians/", {"first_name": "Sarah", "last_name": "Example", "phone": "+61 400 000 001"}, format="json")
        self.assertEqual(guardian.status_code, 201, guardian.data)
        self.assertEqual(guardian.data["phone"], "0400000001")
        response = self.client.post("/api/students/", {"first_name": "Ava", "last_name": "Example", "date_of_birth": "2013-01-15", "guardian_id": guardian.data["id"], "guardian_relationship": "Mother"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        pk = response.data["id"]
        self.assertEqual(len(self.client.get(f"/api/students/{pk}/").data["guardians"]), 1)
        self.assertEqual(self.client.patch(f"/api/students/{pk}/", {"school": "New School"}).status_code, 200)
        self.assertEqual(Student.objects.get(pk=pk).school, "New School")
        emergency = self.client.get(f"/api/students/{pk}/emergency-contacts/")
        self.assertEqual(emergency.data["contacts"][0]["guardian_details"]["phone"], "0400000001")
        self.assertEqual(self.client.delete(f"/api/students/{pk}/").status_code, 204)

    def test_invalid_birth_date_and_phone_are_rejected(self):
        response = self.client.post("/api/students/", {"first_name": "Ava", "last_name": "Example", "date_of_birth": "2999-01-01"}, format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/guardians/", {"first_name": "Sarah", "last_name": "Example", "phone": "abc"})
        self.assertEqual(response.status_code, 400)

    def test_clearing_primary_contact_retains_emergency_link(self):
        student = self.student()
        guardian = Guardian.objects.create(first_name="Sarah", last_name="Parent", phone="0400000001")
        link = StudentGuardian.objects.create(student=student, guardian=guardian, relationship="Mother", is_primary_contact=True, is_emergency_contact=True)
        response = self.client.patch(f"/api/students/{student.pk}/", {"guardian_id": None}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        link.refresh_from_db()
        self.assertFalse(link.is_primary_contact)
        self.assertTrue(link.is_emergency_contact)

    def test_guardian_links_are_atomic(self):
        student = self.student()
        guardian = Guardian.objects.create(first_name="First", last_name="Parent", phone="0400000001")
        StudentGuardian.objects.create(student=student, guardian=guardian, relationship="Mother", is_primary_contact=True)
        response = self.client.post("/api/guardians/", {"first_name": "Second", "last_name": "Parent", "phone": "0400000002",
            "links": [{"student": student.pk, "relationship": "Father", "is_primary_contact": True}]}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Guardian.objects.count(), 1)

    def test_staff_only_see_assigned_students_and_sibling_names_do_not_leak(self):
        student, sibling = self.student(), self.student(first_name="Noah")
        guardian = Guardian.objects.create(first_name="Sarah", last_name="Parent", phone="0400000001")
        for child in (student, sibling):
            StudentGuardian.objects.create(student=child, guardian=guardian, relationship="Mother", is_emergency_contact=True)
        course = Course.objects.create(name="Maths")
        session = ClassSession.objects.create(course=course, date="2026-10-10", start_time="16:00", end_time="17:00", room="One", presenter=self.admin, assistant=self.assistant)
        session.students.add(student)
        self.client.force_authenticate(self.assistant)
        data = self.client.get("/api/students/").data
        self.assertEqual([row["id"] for row in data["results"]], [student.pk])
        self.assertEqual(self.client.get(f"/api/students/{sibling.pk}/").status_code, 404)
        guardian_data = self.client.get(f"/api/guardians/{guardian.pk}/").data
        self.assertEqual([row["student"] for row in guardian_data["students"]], [student.pk])
        self.assertEqual(self.client.patch(f"/api/students/{student.pk}/", {"school": "Changed"}).status_code, 403)
        self.assertEqual(self.client.get("/api/students/import-template/").status_code, 403)

    def test_anonymous_requests_are_denied(self):
        self.client.force_authenticate(None)
        for endpoint in ("students", "guardians", "student-guardians", "attendance", "progress-notes", "sessions"):
            self.assertEqual(self.client.get(f"/api/{endpoint}/").status_code, 401)


class ImportApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_user("admin", role="admin")
        self.client.force_authenticate(self.admin)
        self.row = {"first_name": "Ava", "last_name": "Example", "date_of_birth": "2013-01-15", "school": "Old School",
                    "guardian_first_name": "Sarah", "guardian_last_name": "Example", "guardian_phone": "0400 000 001", "relationship": "Mother"}

    def upload(self, rows, dry_run=False, excel=False):
        if excel:
            workbook = Workbook()
            workbook.active.append(HEADERS)
            for row in rows:
                workbook.active.append([row.get(header, "") for header in HEADERS])
            buffer = io.BytesIO(); workbook.save(buffer)
            file = SimpleUploadedFile("students.xlsx", buffer.getvalue())
        else:
            buffer = io.StringIO(); writer = csv.DictWriter(buffer, fieldnames=HEADERS)
            writer.writeheader(); writer.writerows(rows)
            file = SimpleUploadedFile("students.csv", buffer.getvalue().encode())
        return self.client.post("/api/students/import/", {"file": file, "dry_run": str(dry_run)}, format="multipart")

    def test_import_creates_then_updates_without_duplicates(self):
        first = self.upload([self.row])
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(first.data["created"], 1)
        second = self.upload([{**self.row, "school": "New School", "guardian_phone": "+61 400 000 001"}])
        self.assertEqual(second.status_code, 200, second.data)
        self.assertEqual(second.data["updated"], 1)
        self.assertEqual(Student.objects.count(), 1)
        self.assertEqual(Guardian.objects.count(), 1)
        self.assertEqual(Student.objects.get().school, "New School")

    def test_shared_guardian_phone_does_not_overwrite_siblings(self):
        response = self.upload([self.row, {**self.row, "first_name": "Noah", "date_of_birth": "2014-02-01"}])
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Student.objects.count(), 2)
        self.assertEqual(Guardian.objects.count(), 1)

    def test_excel_dates_and_booleans(self):
        response = self.upload([{**self.row, "date_of_birth": date(2013, 1, 15), "permission_to_travel_alone": "Yes"}], excel=True)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(Student.objects.get().permission_to_travel_alone)

    def test_numeric_excel_phone_is_rejected_to_protect_leading_zeroes(self):
        response = self.upload([{**self.row, "guardian_phone": 400000001}], excel=True)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Student.objects.count(), 0)

    def test_preview_does_not_write_records(self):
        response = self.upload([self.row], dry_run=True)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data["dry_run"])
        self.assertEqual(Student.objects.count(), 0)
        self.assertEqual(Guardian.objects.count(), 0)

    def test_failed_update_import_preserves_existing_values(self):
        self.upload([self.row])
        response = self.upload([{**self.row, "school": "Changed"}, {**self.row, "first_name": "Noah", "date_of_birth": "invalid"}])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Student.objects.get().school, "Old School")

    def test_invalid_row_rolls_back_whole_file(self):
        response = self.upload([self.row, {**self.row, "first_name": "Noah", "date_of_birth": "not-a-date"}])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["errors"][0]["row"], "3")
        self.assertEqual(Student.objects.count(), 0)
        self.assertEqual(Guardian.objects.count(), 0)

    def test_duplicate_rows_and_conflicting_guardian_details_roll_back(self):
        for rows in ([self.row, self.row], [self.row, {**self.row, "first_name": "Noah", "guardian_first_name": "Different"}]):
            response = self.upload(rows)
            self.assertEqual(response.status_code, 400, response.data)
            self.assertEqual(Student.objects.count(), 0)

    def test_explicit_student_id_can_update_changed_name(self):
        self.upload([self.row])
        student = Student.objects.get()
        response = self.upload([{**self.row, "student_id": str(student.pk), "first_name": "Avery"}])
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Student.objects.count(), 1)
        self.assertEqual(Student.objects.get().first_name, "Avery")

    def test_changed_birth_date_without_id_is_rejected(self):
        self.upload([self.row])
        response = self.upload([{**self.row, "date_of_birth": "2013-02-01"}])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Student.objects.count(), 1)

    def test_formula_and_wrong_format_are_rejected(self):
        response = self.upload([{**self.row, "school": "=HYPERLINK(\"https://example.com\")"}], excel=True)
        self.assertEqual(response.status_code, 400)
        response = self.client.post("/api/students/import/", {"file": SimpleUploadedFile("bad.xls", b"invalid")}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Student.objects.count(), 0)

    def test_import_requires_admin_and_template_is_downloadable(self):
        response = self.client.get("/api/students/import-template/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.content.startswith(b"PK"))
        self.client.force_authenticate(User.objects.create_user("assistant"))
        self.assertEqual(self.upload([self.row]).status_code, 403)

    def test_import_requests_are_throttled(self):
        for _ in range(10):
            self.assertEqual(self.upload([self.row], dry_run=True).status_code, 200)
        self.assertEqual(self.upload([self.row], dry_run=True).status_code, 429)
