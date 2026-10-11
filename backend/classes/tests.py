from rest_framework.test import APITestCase

from accounts.models import User
from students.models import Student
from .models import Attendance, ClassSession, Course, ProgressNote, Registration


class ClassWorkflowTests(APITestCase):
    def setUp(self):
<<<<<<< HEAD
        self.admin = User.objects.create_user("admin@example.test", role="admin")
        self.presenter = User.objects.create_user("presenter@example.test", role="presenter")
        self.assistant = User.objects.create_user("assistant@example.test")
        self.outsider = User.objects.create_user("outsider@example.test", role="presenter")
=======
        self.admin = User.objects.create_user("admin", role="admin")
        self.presenter = User.objects.create_user("presenter", role="presenter")
        self.assistant = User.objects.create_user("assistant")
        self.outsider = User.objects.create_user("outsider", role="presenter")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
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
<<<<<<< HEAD


class SessionLifecycleTests(APITestCase):
    setUp = ClassWorkflowTests.setUp

    def booking(self, **overrides):
        return {"course": self.course.pk, "date": "2026-10-10", "start_time": "16:30", "end_time": "17:30",
                "room": "Two", "capacity": 2, "presenter": self.outsider.pk, "students": [self.other.pk], **overrides}

    def test_conflicts_and_adjacent_sessions(self):
        for fields in (dict(room="  oNe  "), dict(presenter=self.presenter.pk), dict(assistant=self.assistant.pk), dict(students=[self.student.pk])):
            r = self.client.post("/api/sessions/", self.booking(**fields), format="json")
            self.assertEqual(r.status_code, 400, r.data)
        r = self.client.post("/api/sessions/", self.booking(start_time="17:00", end_time="18:00", room="One", presenter=self.presenter.pk, students=[self.student.pk]), format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(self.client.patch(f"/api/sessions/{self.session.pk}/", {"capacity": 30}).status_code, 200)

    def test_cancel_retains_history_and_closes_all_write_routes(self):
        mark = Attendance.objects.create(session=self.session, student=self.student, status="present")
        note = ProgressNote.objects.create(session=self.session, student=self.student, text="Prior note", author=self.presenter)
        r = self.client.post(f"/api/sessions/{self.session.pk}/cancel/", {"reason": "Presenter unavailable"})
        self.assertEqual(r.status_code, 200, r.data)
        self.assertTrue(r.data["has_history"])
        self.assertEqual(r.data["status"], "cancelled")
        self.assertEqual(self.session.attendance.count(), 1)
        self.assertEqual(self.session.progress_notes.count(), 1)
        self.assertEqual(self.session.status_events.get().changed_by, self.admin)
        self.assertEqual(self.client.post(f"/api/sessions/{self.session.pk}/attendance/", {"records": [{"student": self.student.pk, "status": "late"}]}, format="json").status_code, 400)
        self.assertEqual(self.client.patch(f"/api/attendance/{mark.pk}/", {"status": "late"}).status_code, 400)
        self.assertEqual(self.client.delete(f"/api/attendance/{mark.pk}/").status_code, 400)
        self.assertEqual(self.client.patch(f"/api/progress-notes/{note.pk}/", {"text": "Changed"}).status_code, 400)
        self.assertEqual(self.client.delete(f"/api/progress-notes/{note.pk}/").status_code, 400)
        self.assertEqual(self.client.get(f"/api/sessions/{self.session.pk}/roster/").status_code, 200)

    def test_archive_inactive_resources_and_no_hard_delete(self):
        self.presenter.is_active = False; self.presenter.save()
        self.course.is_active = False; self.course.save()
        self.assertEqual(self.client.post(f"/api/sessions/{self.session.pk}/archive/", {}).status_code, 200)
        self.assertEqual(self.client.delete(f"/api/sessions/{self.session.pk}/").status_code, 409)
        self.assertTrue(ClassSession.objects.filter(pk=self.session.pk).exists())
        self.assertEqual(self.client.patch(f"/api/sessions/{self.session.pk}/", {"room": "New room"}).status_code, 400)

    def test_restore_rechecks_conflict_atomically(self):
        url = f"/api/sessions/{self.session.pk}"
        self.assertEqual(self.client.post(url + "/cancel/", {}).status_code, 200)
        r = self.client.post("/api/sessions/", self.booking(room="One"), format="json")
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(self.client.post(url + "/restore/", {}).status_code, 400)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "cancelled")
        self.assertEqual(self.session.status_events.count(), 1)
        self.client.post(f"/api/sessions/{r.data['id']}/cancel/", {})
        self.assertEqual(self.client.post(url + "/restore/", {}).status_code, 200)
        self.assertEqual(self.session.status_events.count(), 2)

    def test_status_admin_only_and_history_dates_preserved(self):
        self.client.force_authenticate(self.presenter)
        for action in ("cancel", "archive", "restore"):
            self.assertEqual(self.client.post(f"/api/sessions/{self.session.pk}/{action}/", {}).status_code, 403)
        self.client.force_authenticate(self.admin)
        Attendance.objects.create(session=self.session, student=self.student, status="absent")
        self.assertEqual(self.client.patch(f"/api/sessions/{self.session.pk}/", {"date": "2026-10-11"}).status_code, 400)
        self.assertEqual(self.client.patch(f"/api/sessions/{self.session.pk}/", {"status": "archived"}).status_code, 200)

    def test_admin_form_same_conflict_validation(self):
        from .admin import ClassSessionAdminForm
        form = ClassSessionAdminForm(data=self.booking(room="One", status="scheduled"))
        self.assertFalse(form.is_valid())
        self.assertIn("room already booked", str(form.errors))


class ReportWorkflowTests(APITestCase):
    setUp = ClassWorkflowTests.setUp

    def test_summary_counts_unmarked_and_archive_cancel_differ(self):
        self.session.students.add(self.other)
        Attendance.objects.create(session=self.session, student=self.student, status="late")
        r = self.client.get("/api/reports/summary/?kind=attendance")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data["results"][0]["unmarked"], 1)
        self.assertEqual(r.data["results"][0]["rate"], 100.0)
        self.client.post(f"/api/sessions/{self.session.pk}/archive/", {})
        self.assertEqual(self.client.get("/api/reports/summary/?kind=attendance").data["count"], 1)
        self.client.post(f"/api/sessions/{self.session.pk}/cancel/", {})
        self.assertEqual(self.client.get("/api/reports/summary/?kind=attendance").data["count"], 0)

    def test_scoped_filtered_csv_exports_all_types(self):
        Attendance.objects.create(session=self.session, student=self.student, status="late", notes="=formula")
        ProgressNote.objects.create(session=self.session, student=self.student, text="=note", author=self.presenter, date="2026-10-01")
        for kind in ("attendance", "late-arrivals", "enrolment", "progress-notes"):
            url = f"/api/reports/summary/?kind={kind}"
            self.assertEqual(self.client.get(url).status_code, 200)
            csv = self.client.get(url + "&export=csv")
            self.assertEqual(csv.status_code, 200)
            if kind in ("late-arrivals", "progress-notes"): self.assertIn("'=", csv.content.decode())
            self.client.force_authenticate(self.outsider)
            self.assertEqual(self.client.get(url).data["count"], 0)
            self.client.force_authenticate(self.admin)
        for query in ("date_from=wrong", "date_from=2026-10-11&date_to=2026-10-01", "kind=unknown", "course=abc"):
            self.assertEqual(self.client.get("/api/reports/summary/?" + query).status_code, 400)
        self.assertEqual(self.client.get("/api/reports/summary/?kind=attendance&date_from=2026-10-11").data["count"], 0)

    def test_class_list_latest_prior_note_and_access(self):
        ProgressNote.objects.create(student=self.student, text="Earlier note", author=self.presenter, date="2026-10-01")
        ProgressNote.objects.create(student=self.student, text='ASP_PROGRESS_NOTE_V1:{"version":1,"answersChecked":"yes","comments":"Latest work"}', author=self.presenter, date="2026-10-02")
        ProgressNote.objects.create(student=self.student, text="After class", author=self.presenter, date="2026-10-11")
        r = self.client.get(f"/api/sessions/{self.session.pk}/class-list/")
        self.assertEqual(r.status_code, 200, r.data)
        self.assertIn("Latest work", r.data["results"][0]["latest_note"])
        self.assertNotIn("After class", r.data["results"][0]["latest_note"])
        self.assertEqual(self.client.get(f"/api/sessions/{self.session.pk}/class-list/?export=csv").status_code, 200)
        self.client.force_authenticate(self.outsider)
        self.assertEqual(self.client.get(f"/api/sessions/{self.session.pk}/class-list/").status_code, 404)
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
