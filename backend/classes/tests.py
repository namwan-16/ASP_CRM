from rest_framework.test import APITestCase

from accounts.models import User
from students.models import Student
from .models import Attendance, ClassSession, Course, ProgressNote, Registration


class ClassWorkflowTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin", role="admin")
        self.presenter = User.objects.create_user("presenter", role="presenter")
        self.assistant = User.objects.create_user("assistant")
        self.outsider = User.objects.create_user("outsider", role="presenter")
        self.student = Student.objects.create(first_name="Ava", last_name="Example", date_of_birth="2013-01-15")
        self.other = Student.objects.create(first_name="Noah", last_name="Example", date_of_birth="2014-01-15")
        self.course = Course.objects.create(name="Maths")
        self.session = ClassSession.objects.create(course=self.course, date="2026-10-10", start_time="16:00", end_time="17:00", room="One", presenter=self.presenter, assistant=self.assistant)
        self.session.students.add(self.student)
        self.client.force_authenticate(self.admin)

    def test_session_creation_registers_students_and_validates_schedule(self):
        data = {"course": self.course.pk, "date": "2026-10-11", "start_time": "16:00", "end_time": "17:00", "room": "Two",
                "capacity": 2, "presenter": self.presenter.pk, "students": [self.student.pk]}
        response = self.client.post("/api/sessions/", data, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(Registration.objects.filter(student=self.student, course=self.course).exists())
        self.assertEqual(self.client.post("/api/sessions/", {**data, "end_time": "15:00"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/sessions/", {**data, "capacity": 0}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/sessions/", data, format="json").status_code, 400)

    def test_staff_can_mark_assigned_roster_and_upsert(self):
        self.client.force_authenticate(self.assistant)
        response = self.client.get(f"/api/sessions/{self.session.pk}/roster/")
        self.assertEqual(response.data["students"][0]["status"], "")
        url = f"/api/sessions/{self.session.pk}/attendance/"
        response = self.client.post(url, {"records": [{"student": self.student.pk, "status": "present"}]}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        response = self.client.post(url, {"records": [{"student": self.student.pk, "status": "late", "notes": "Bus delay"}]}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Attendance.objects.count(), 1)
        self.assertEqual(Attendance.objects.get().status, "late")
        self.assertEqual(Attendance.objects.get().marked_by, self.assistant)

    def test_invalid_attendance_batch_is_atomic(self):
        response = self.client.post(f"/api/sessions/{self.session.pk}/attendance/", {"records": [
            {"student": self.student.pk, "status": "present"}, {"student": self.other.pk, "status": "present"},
        ]}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Attendance.objects.count(), 0)

    def test_invalid_attendance_status_and_duplicate_student(self):
        for records in ([{"student": self.student.pk, "status": "unknown"}],
                        [{"student": self.student.pk, "status": "present"}] * 2):
            response = self.client.post(f"/api/sessions/{self.session.pk}/attendance/", {"records": records}, format="json")
            self.assertEqual(response.status_code, 400)
        self.assertEqual(Attendance.objects.count(), 0)

    def test_attendance_batch_rejects_non_object_root(self):
        response = self.client.post(f"/api/sessions/{self.session.pk}/attendance/", [], format="json")
        self.assertEqual(response.status_code, 400)

    def test_unassigned_staff_cannot_access_or_mark_class(self):
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.get("/api/sessions/").data["count"], 0)
        self.assertEqual(self.client.get(f"/api/sessions/{self.session.pk}/roster/").status_code, 404)
        self.assertEqual(self.client.post(f"/api/sessions/{self.session.pk}/attendance/", {"records": [{"student": self.student.pk, "status": "present"}]}, format="json").status_code, 404)
        response = self.client.post("/api/attendance/", {"session": self.session.pk, "student": self.student.pk, "status": "present"}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_progress_note_authorship_and_edit_permissions(self):
        self.client.force_authenticate(self.presenter)
        response = self.client.post("/api/progress-notes/", {"student": self.student.pk, "text": "Completed fractions", "author": self.admin.pk}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        note = ProgressNote.objects.get()
        self.assertEqual(note.author, self.presenter)
        self.client.force_authenticate(self.assistant)
        self.assertEqual(self.client.patch(f"/api/progress-notes/{note.pk}/", {"text": "Changed"}).status_code, 403)
        self.assertEqual(self.client.delete(f"/api/progress-notes/{note.pk}/").status_code, 403)
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.patch(f"/api/progress-notes/{note.pk}/", {"text": "Updated note"}).status_code, 200)

    def test_notes_reject_unassigned_student_and_wrong_roster(self):
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.post("/api/progress-notes/", {"student": self.other.pk, "text": "Secret"}, format="json").status_code, 403)
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/progress-notes/", {"student": self.other.pk, "session": self.session.pk, "text": "Wrong roster"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.post("/api/progress-notes/", {"student": self.student.pk, "text": ""}, format="json").status_code, 400)

    def test_history_is_protected_from_deletion_and_roster_removal(self):
        Attendance.objects.create(session=self.session, student=self.student, status="present")
        self.assertEqual(self.client.delete(f"/api/students/{self.student.pk}/").status_code, 409)
        self.assertEqual(self.client.delete(f"/api/sessions/{self.session.pk}/").status_code, 409)
        self.assertEqual(self.client.patch(f"/api/sessions/{self.session.pk}/", {"students": []}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(f"/api/students/{self.student.pk}/", {"is_active": False}).status_code, 200)

    def test_staff_cannot_delete_attendance_or_manage_courses(self):
        record = Attendance.objects.create(session=self.session, student=self.student, status="present")
        self.client.force_authenticate(self.assistant)
        self.assertEqual(self.client.delete(f"/api/attendance/{record.pk}/").status_code, 403)
        self.assertEqual(self.client.post("/api/courses/", {"name": "Science"}).status_code, 403)

    def test_dashboard_and_csv_are_scoped_and_formula_safe(self):
        Attendance.objects.create(session=self.session, student=self.student, status="late", notes="=HYPERLINK(\"bad\")")
        response = self.client.get("/api/reports/attendance/?export=csv")
        self.assertEqual(response.status_code, 200)
        self.assertIn("'=HYPERLINK", response.content.decode())
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.get("/api/dashboard/").data["students"], 0)
        self.assertEqual(self.client.get("/api/reports/attendance/").data["count"], 0)

    def test_invalid_filter_is_a_validation_error(self):
        self.assertEqual(self.client.get("/api/attendance/?student=abc").status_code, 400)
        self.assertEqual(self.client.get("/api/reports/attendance/?date_from=wrong").status_code, 400)
