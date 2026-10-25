from django.db.models.deletion import ProtectedError
from django.test import RequestFactory
from rest_framework.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from classes.models import ClassSession, Course, ProgressNote
from students.models import Student
from .lifecycle import validate_staff_access
from .models import User


class StaffLifecycleTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin@example.test", role="admin")
        self.presenter = User.objects.create_user("presenter@example.test", role="presenter")
        self.client.force_authenticate(self.admin)

    def test_unused_account_deletion_admin_only(self):
        url = f"/api/auth/users/{self.presenter.pk}/"
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(url).status_code, 204)

    def test_used_presenter_deactivate_reactivate_and_delete_blocked(self):
        course = Course.objects.create(name="Maths")
        session = ClassSession.objects.create(course=course, presenter=self.presenter, date="2026-10-09", start_time="16:00", end_time="17:00", room="One")
        url = f"/api/auth/users/{self.presenter.pk}/"
        self.assertEqual(self.client.delete(url).status_code, 409)
        for active in (False, True):
            self.assertEqual(self.client.patch(url, {"is_active": active}).status_code, 200)
            session.refresh_from_db()
            self.assertEqual(session.presenter_id, self.presenter.pk)
        with self.assertRaises(ProtectedError):
            self.presenter.delete()

    def test_note_author_and_assistant_accounts_cannot_be_deleted(self):
        student = Student.objects.create(first_name="Ava", last_name="Example", date_of_birth="2013-01-15")
        ProgressNote.objects.create(student=student, text="Keep", author=self.presenter)
        self.assertEqual(self.client.delete(f"/api/auth/users/{self.presenter.pk}/").status_code, 409)
        assistant = User.objects.create_user("assistant@example.test")
        course = Course.objects.create(name="Maths")
        ClassSession.objects.create(course=course, presenter=self.admin, assistant=assistant, date="2026-10-09", start_time="16:00", end_time="17:00", room="One")
        self.assertEqual(self.client.delete(f"/api/auth/users/{assistant.pk}/").status_code, 409)

    def test_logged_in_account_is_not_an_unused_duplicate(self):
        RefreshToken.for_user(self.presenter)
        self.assertEqual(self.client.delete(f"/api/auth/users/{self.presenter.pk}/").status_code, 409)

    def test_deactivation_revokes_existing_access(self):
        token = str(RefreshToken.for_user(self.presenter).access_token)
        self.assertEqual(self.client.patch(f"/api/auth/users/{self.presenter.pk}/", {"is_active": False}).status_code, 200)
        self.client.force_authenticate(None)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 401)

    def test_cannot_demote_deactivate_or_delete_self(self):
        url = f"/api/auth/users/{self.admin.pk}/"
        for attrs in ({"role": "presenter"}, {"is_active": False}):
            self.assertEqual(self.client.patch(url, attrs).status_code, 400)
        self.assertEqual(self.client.delete(url).status_code, 400)

    def test_last_active_admin_guard_and_safe_role_change(self):
        for attrs in ({"role": "presenter"}, {"is_active": False}, {"is_active": False, "role": "presenter"}):
            with self.assertRaises(ValidationError):
                validate_staff_access(self.admin, attrs, self.presenter)
        other_admin = User.objects.create_user("second-admin@example.test", role="admin")
        self.assertEqual(self.client.patch(f"/api/auth/users/{other_admin.pk}/", {"role": "presenter"}).status_code, 200)
        self.client.force_authenticate(self.presenter)
        self.assertEqual(self.client.patch(f"/api/auth/users/{other_admin.pk}/", {"role": "admin"}).status_code, 403)

    def test_admin_site_cannot_bypass_self_access_guard(self):
        from .admin import CustomUserAdmin
        from django.contrib.admin import AdminSite
        admin = CustomUserAdmin(User, AdminSite())
        self.admin.is_staff = self.admin.is_superuser = True
        self.admin.save()
        request = RequestFactory().get("/admin/accounts/user/")
        request.user = self.admin
        self.assertFalse(admin.has_delete_permission(request, self.admin))
        form = admin.get_form(request, self.admin)(instance=self.admin, data={
            "first_name": "", "last_name": "", "email": "admin@example.test", "role": "presenter",
            "is_staff": "on", "is_active": "on", "is_superuser": "", "groups": [], "user_permissions": [],
            "date_joined_0": "2026-10-09", "date_joined_1": "12:00:00",
        })
        self.assertFalse(form.is_valid())
        self.assertIn("own admin access", str(form.non_field_errors()))
