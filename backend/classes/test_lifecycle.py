from datetime import date

from django.db.models.deletion import ProtectedError
from rest_framework.test import APITestCase

from accounts.models import User
from students.models import Guardian, Student, StudentGuardian
from .models import Attendance, ClassSession, Course, NoteEvent, ProgressNote, Registration


class LifecycleApiTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin@example.test", role="admin")
        self.presenter = User.objects.create_user("presenter@example.test", role="presenter")
        self.other_presenter = User.objects.create_user("other-presenter@example.test", role="presenter")
        self.course = Course.objects.create(name="Biology")
        self.student = Student.objects.create(first_name="Ava", last_name="Example", date_of_birth="2013-01-15")
        self.client.force_authenticate(self.admin)

    def session(self, **values):
        session = ClassSession.objects.create(course=self.course, presenter=self.presenter, date=date.today(),
                                              start_time="16:00", end_time="17:00", room="One", **values)
        session.students.add(self.student)
        return session

    def test_unused_student_delete_is_allowed_but_presenter_cannot_delete(self):
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.delete(f"/api/students/{self.student.pk}/").status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertTrue(self.client.get(f"/api/students/{self.student.pk}/").data["can_delete"])
        self.assertEqual(self.client.delete(f"/api/students/{self.student.pk}/").status_code, 204)

    def test_enrolment_blocks_student_delete_even_when_paused(self):
        Registration.objects.create(student=self.student, course=self.course, is_active=False)
        response = self.client.delete(f"/api/students/{self.student.pk}/")
        self.assertEqual(response.status_code, 409, response.data)
        self.assertTrue(Student.objects.filter(pk=self.student.pk).exists())
        self.assertFalse(self.client.get(f"/api/students/{self.student.pk}/").data["can_delete"])

    def test_attendance_and_class_roster_block_student_delete(self):
        session = self.session()
        Attendance.objects.create(session=session, student=self.student, status="present", marked_by=self.presenter)
        session.students.remove(self.student)
        self.assertEqual(self.client.delete(f"/api/students/{self.student.pk}/").status_code, 409)
        self.assertEqual(Attendance.objects.count(), 1)

    def test_deleted_general_note_alone_blocks_student_deletion(self):
        note = ProgressNote.objects.create(student=self.student, text="History", author=self.admin)
        self.assertEqual(self.client.delete(f"/api/progress-notes/{note.pk}/").status_code, 204)
        self.assertFalse(self.student.registrations.exists())
        self.assertFalse(self.student.class_sessions.exists())
        self.assertFalse(self.student.attendance.exists())
        self.assertEqual(self.client.delete(f"/api/students/{self.student.pk}/").status_code, 409)
        self.assertEqual(ProgressNote.objects.get(pk=note.pk).text, "History")

    def test_deactivate_reactivate_keeps_all_student_history(self):
        session = self.session()
        registration = Registration.objects.create(student=self.student, course=self.course)
        mark = Attendance.objects.create(session=session, student=self.student, status="late")
        note = ProgressNote.objects.create(student=self.student, session=session, text="Original", author=self.presenter)
        for action, active in (("deactivate", False), ("reactivate", True)):
            response = self.client.post(f"/api/students/{self.student.pk}/{action}/")
            self.assertEqual(response.status_code, 200, response.data)
            self.student.refresh_from_db()
            self.assertEqual(self.student.is_active, active)
            self.assertTrue(Registration.objects.filter(pk=registration.pk).exists())
            self.assertTrue(Attendance.objects.filter(pk=mark.pk).exists())
            self.assertTrue(ProgressNote.objects.filter(pk=note.pk).exists())
            self.assertTrue(session.students.filter(pk=self.student.pk).exists())
        self.client.force_authenticate(self.presenter)
        for action in ("deactivate", "reactivate"):
            self.assertEqual(self.client.post(f"/api/students/{self.student.pk}/{action}/").status_code, 403)

    def test_guardian_fetch_update_and_unlink_preserve_other_students(self):
        sibling = Student.objects.create(first_name="Noah", last_name="Example", date_of_birth="2014-01-15")
        guardian = Guardian.objects.create(first_name="Sarah", last_name="Parent", phone="0400000001")
        for child in (self.student, sibling):
            StudentGuardian.objects.create(student=child, guardian=guardian, relationship="Mother",
                                          is_primary_contact=True, is_emergency_contact=True)
        url = f"/api/guardians/{guardian.pk}/"
        fetched = self.client.get(url)
        self.assertEqual(fetched.data["phone"], "0400000001")
        self.assertEqual(len(fetched.data["students"]), 2)
        self.assertFalse(fetched.data["can_delete"])
        self.assertEqual(self.client.delete(url).status_code, 409)
        self.assertEqual(self.client.patch(url, {"phone": "0400000002"}).status_code, 200)
        self.assertEqual(guardian.student_links.count(), 2)
        response = self.client.patch(url, {"links": [{"student": sibling.pk, "relationship": "Parent",
                                                     "is_primary_contact": False, "is_emergency_contact": True}]}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual([link.student_id for link in guardian.student_links.all()], [sibling.pk])
        self.assertFalse(guardian.student_links.get().is_primary_contact)
        self.assertTrue(guardian.student_links.get().is_emergency_contact)
        self.assertEqual(self.client.delete(url).status_code, 409)
        self.assertEqual(Guardian.objects.count(), 1)
        self.assertEqual(self.client.patch(url, {"links": []}, format="json").status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertEqual(Student.objects.count(), 2)

    def test_guardian_database_protects_links_and_presenter_cannot_unlink(self):
        self.session()
        guardian = Guardian.objects.create(first_name="Sarah", last_name="Parent", phone="0400000001")
        link = StudentGuardian.objects.create(student=self.student, guardian=guardian, relationship="Mother")
        with self.assertRaises(ProtectedError):
            guardian.delete()
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.patch(f"/api/guardians/{guardian.pk}/", {"phone": "0400000003"}).status_code, 403)
        self.assertEqual(self.client.delete(f"/api/guardians/{guardian.pk}/").status_code, 403)
        self.assertEqual(self.client.delete(f"/api/student-guardians/{link.pk}/").status_code, 403)

    def test_dynamic_subject_id_and_rename_keep_student_reference(self):
        response = self.client.patch(f"/api/students/{self.student.pk}/", {"subject_id": self.course.pk})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["subject"], "Biology")
        self.client.patch(f"/api/courses/{self.course.pk}/", {"name": "Life Sciences"})
        fetched = self.client.get(f"/api/students/{self.student.pk}/").data
        self.assertEqual(fetched["subject_id"], self.course.pk)
        self.assertEqual(fetched["subject"], "Life Sciences")
        legacy = self.client.patch(f"/api/students/{self.student.pk}/", {"subject": "Biology", "school": "Legacy client"})
        self.assertEqual(legacy.status_code, 200, legacy.data)
        self.assertEqual(legacy.data["subject_id"], self.course.pk)
        self.assertEqual(legacy.data["subject"], "Life Sciences")
        self.assertEqual(self.client.delete(f"/api/courses/{self.course.pk}/").status_code, 409)

    def test_archived_subject_excluded_from_new_assignment_but_retained_on_records(self):
        self.client.patch(f"/api/students/{self.student.pk}/", {"subject_id": self.course.pk})
        self.course.is_active = False
        self.course.save()
        self.assertEqual(self.client.patch(f"/api/students/{self.student.pk}/", {"subject_id": self.course.pk, "school": "Updated"}).status_code, 200)
        other = Student.objects.create(first_name="New", last_name="Student", date_of_birth="2014-01-15")
        self.assertEqual(self.client.patch(f"/api/students/{other.pk}/", {"subject_id": self.course.pk}).status_code, 400)
        self.assertEqual(self.client.patch(f"/api/students/{other.pk}/", {"subject": "Unknown"}).status_code, 400)
        self.assertEqual(self.client.patch(f"/api/courses/{self.course.pk}/", {"is_active": True}).status_code, 200)
        self.assertEqual(self.client.patch(f"/api/students/{other.pk}/", {"subject_id": self.course.pk}).status_code, 200)

    def test_unused_subject_delete_and_case_insensitive_name_check(self):
        duplicate = self.client.post("/api/courses/", {"name": "biology"})
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(self.client.delete(f"/api/courses/{self.course.pk}/").status_code, 204)

    def test_used_subject_archive_and_presenter_view_scope(self):
        session = self.session()
        unrelated = Course.objects.create(name="Unassigned")
        self.assertEqual(self.client.delete(f"/api/courses/{self.course.pk}/").status_code, 409)
        self.assertEqual(self.client.patch(f"/api/courses/{self.course.pk}/", {"is_active": False}).status_code, 200)
        self.assertEqual(self.client.patch(f"/api/sessions/{session.pk}/", {"capacity": 25}).status_code, 200)
        self.client.force_authenticate(self.presenter)
        self.assertEqual([row["id"] for row in self.client.get("/api/courses/").data["results"]], [self.course.pk])
        self.assertEqual(self.client.get(f"/api/courses/{unrelated.pk}/").status_code, 404)
        for method, data in (("patch", {"is_active": True}), ("delete", None)):
            self.assertEqual(getattr(self.client, method)(f"/api/courses/{self.course.pk}/", data).status_code, 403)

    def test_pause_and_resume_same_enrolment_without_losing_history(self):
        session = self.session()
        registration = Registration.objects.create(student=self.student, course=self.course)
        note = ProgressNote.objects.create(student=self.student, text="Keep me", author=self.presenter)
        url = f"/api/registrations/{registration.pk}/"
        for active in (False, True):
            response = self.client.patch(url, {"is_active": active})
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data["id"], registration.pk)
            self.assertTrue(ProgressNote.objects.filter(pk=note.pk).exists())
        self.assertEqual(self.client.delete(url).status_code, 409)
        self.client.patch(url, {"is_active": False})
        self.client.patch(f"/api/sessions/{session.pk}/", {"capacity": 25})
        registration.refresh_from_db()
        self.assertFalse(registration.is_active, "Editing a session must not resume a paused enrolment")
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.patch(url, {"is_active": True}).status_code, 403)

    def test_note_edit_is_allowed_for_presenter_but_delete_only_own(self):
        self.session()
        note = ProgressNote.objects.create(student=self.student, text="Original", author=self.other_presenter)
        url = f"/api/progress-notes/{note.pk}/"
        self.client.force_authenticate(self.presenter)
        response = self.client.patch(url, {"text": "Corrected"})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(NoteEvent.objects.get().text, "Original")
        note.refresh_from_db()
        self.assertEqual(note.author_id, self.other_presenter.pk)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.post(url + "restore/").status_code, 403)

    def test_deleted_notes_remain_recoverable_and_protect_student(self):
        self.session()
        self.client.force_authenticate(self.presenter)
        created = self.client.post("/api/progress-notes/", {"student": self.student.pk, "text": "Keep history"})
        self.assertEqual(created.status_code, 201, created.data)
        note_id = created.data["id"]
        url = f"/api/progress-notes/{note_id}/"
        self.assertEqual(self.client.delete(url).status_code, 204)
        note = ProgressNote.objects.get(pk=note_id)
        self.assertTrue(note.is_deleted)
        self.assertEqual(note.deleted_by_id, self.presenter.pk)
        self.assertEqual(self.client.get("/api/progress-notes/").data["count"], 0)
        self.assertEqual(self.client.get("/api/progress-notes/?is_deleted=true").data["count"], 1)
        self.assertEqual(self.client.patch(url + "?is_deleted=true", {"text": "Overwrite"}).status_code, 400)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"/api/students/{self.student.pk}/").status_code, 409)
        self.assertEqual(self.client.get("/api/reports/summary/?kind=progress-notes").data["count"], 0)
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.post(url + "restore/").status_code, 200)
        self.assertEqual(self.client.get(url).data["text"], "Keep history")
        self.assertEqual(set(NoteEvent.objects.filter(note_id=note_id).values_list("action", flat=True)), {"created", "deleted", "restored"})

    def test_presenter_cannot_edit_unassigned_notes(self):
        unrelated = Student.objects.create(first_name="Other", last_name="Student", date_of_birth="2014-01-15")
        note = ProgressNote.objects.create(student=unrelated, text="Private", author=self.other_presenter)
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.patch(f"/api/progress-notes/{note.pk}/", {"text": "Changed"}).status_code, 404)

    def test_archive_and_resume_session_keeps_marks_notes_and_roster(self):
        session = self.session()
        mark = Attendance.objects.create(session=session, student=self.student, status="present")
        note = ProgressNote.objects.create(session=session, student=self.student, text="Keep", author=self.presenter)
        for action, status in (("archive", "archived"), ("restore", "scheduled")):
            response = self.client.post(f"/api/sessions/{session.pk}/{action}/", {"reason": "Paused course"})
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data["status"], status)
            self.assertEqual(response.data["students"], [self.student.pk])
            self.assertTrue(Attendance.objects.filter(pk=mark.pk).exists())
            self.assertTrue(ProgressNote.objects.filter(pk=note.pk).exists())

    def test_default_pagination_is_five_and_pages_do_not_repeat_records(self):
        for i in range(6):
            Guardian.objects.create(first_name=f"Guardian {i}", last_name="Parent", phone="0400000001")
        first = self.client.get("/api/guardians/").data
        second = self.client.get("/api/guardians/?page=2").data
        self.assertEqual(len(first["results"]), 5)
        self.assertEqual(len(second["results"]), 1)
        self.assertEqual(first["count"], 6)
        self.assertFalse({r["id"] for r in first["results"]} & {r["id"] for r in second["results"]})

    def test_django_admin_model_permissions_cannot_grant_presenter_subject_management(self):
        from django.contrib.admin import AdminSite
        from django.contrib.auth.models import Permission
        from django.test import RequestFactory
        from config.admin import AdminManagedModelAdmin
        self.presenter.is_staff = True
        self.presenter.save()
        self.presenter.user_permissions.add(*Permission.objects.filter(content_type__app_label="classes", content_type__model="course"))
        request = RequestFactory().get("/admin/classes/course/")
        request.user = self.presenter
        admin = AdminManagedModelAdmin(Course, AdminSite())
        self.assertTrue(request.user.has_perm("classes.change_course"))
        self.assertFalse(admin.has_add_permission(request))
        self.assertFalse(admin.has_change_permission(request, self.course))
        self.assertFalse(admin.has_delete_permission(request, self.course))
