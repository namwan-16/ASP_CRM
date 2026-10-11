from io import StringIO

from django.contrib import admin
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.core.management import call_command
from django.db import IntegrityError, connection, transaction
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .forms import EmailUserChangeForm, EmailUserCreationForm
from .models import User


PASSWORD = "EmailOnlySafePass748!"


class EmailUserModelTests(TestCase):
    def test_model_and_database_have_no_username_field(self):
        self.assertEqual(User.USERNAME_FIELD, "email")
        self.assertEqual(User.REQUIRED_FIELDS, [])
        with self.assertRaises(FieldDoesNotExist):
            User._meta.get_field("username")
        with connection.cursor() as cursor:
            columns = connection.introspection.get_table_description(cursor, User._meta.db_table)
        self.assertNotIn("username", [column.name for column in columns])

    def test_manager_requires_valid_email_and_normalizes_it(self):
        user = User.objects.create_user("  EmailOnly@Example.COM  ", PASSWORD)
        self.assertEqual(user.email, "emailonly@example.com")
        self.assertTrue(user.check_password(PASSWORD))
        self.assertEqual(authenticate(email="EMAILONLY@EXAMPLE.COM", password=PASSWORD), user)
        for value in ("", None, "   "):
            with self.assertRaises(ValueError):
                User.objects.create_user(value, PASSWORD)
        with self.assertRaises(ValidationError):
            User.objects.create_user("invalid", PASSWORD)

    def test_database_blocks_duplicate_emails_even_when_bulk_updates_bypass_save(self):
        User.objects.create_user("staff@example.com")
        other = User.objects.create_user("other@example.com")
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.filter(pk=other.pk).update(email=" STAFF@EXAMPLE.COM ")
        with self.assertRaises(IntegrityError), transaction.atomic():
            User.objects.filter(pk=other.pk).update(email="")

    def test_createsuperuser_uses_only_email_and_password(self):
        call_command("createsuperuser", email="ROOT@EXAMPLE.COM", interactive=False, stdout=StringIO())
        root = User.objects.get(email="root@example.com")
        self.assertTrue(root.is_staff and root.is_superuser and root.is_active)
        self.assertEqual(root.role, User.Role.ADMIN)
        for flags in ({"is_staff": False}, {"is_superuser": False}, {"is_active": False}):
            with self.assertRaises(ValueError):
                User.objects.create_superuser("invalid-root@example.com", PASSWORD, **flags)

    def test_admin_creation_and_edit_forms_have_no_username(self):
        form = EmailUserCreationForm(data={"email": "  NEW@EXAMPLE.COM  ", "password1": PASSWORD,
                                          "password2": PASSWORD, "role": "presenter"})
        self.assertNotIn("username", form.fields)
        self.assertTrue(form.is_valid(), form.errors)
        user = form.save()
        self.assertEqual(user.email, "new@example.com")
        self.assertTrue(user.check_password(PASSWORD))
        duplicate = EmailUserCreationForm(data={"email": "NEW@example.com", "password1": PASSWORD,
                                               "password2": PASSWORD, "role": "presenter"})
        self.assertFalse(duplicate.is_valid())
        self.assertIn("email", duplicate.errors)
        edit = EmailUserChangeForm(instance=user)
        self.assertNotIn("username", edit.fields)
        self.assertNotIn("username", admin.site._registry[User].ordering)


class EmailAuthenticationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user("presenter@example.com", PASSWORD, role="presenter")

    def tearDown(self):
        cache.clear()
        super().tearDown()

    def login(self, email="presenter@example.com", password=PASSWORD):
        return self.client.post(reverse("login"), {"email": email, "password": password}, format="json")

    def test_login_uses_email_case_insensitively_and_refresh_preserves_user_id(self):
        response = self.login("  PRESENTER@EXAMPLE.COM  ")
        self.assertEqual(response.status_code, 200, response.data)
        refresh = self.client.post(reverse("token-refresh"), {"refresh": response.data["refresh"]})
        self.assertEqual(refresh.status_code, 200, refresh.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.data['access']}")
        current = self.client.get(reverse("current-user"))
        self.assertEqual(current.data["id"], self.user.pk)
        self.assertEqual(current.data["email"], self.user.email)
        self.assertNotIn("username", current.data)

    def test_username_login_and_missing_or_invalid_email_are_rejected(self):
        response = self.client.post(reverse("login"), {"username": "presenter", "password": PASSWORD})
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)
        for value in ("", "presenter"):
            self.assertEqual(self.login(value).status_code, 400)

    def test_unknown_email_wrong_password_and_inactive_user_share_generic_error(self):
        unknown = self.login("unknown@example.com")
        wrong = self.login(password="wrong")
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        inactive = self.login()
        for result in (unknown, wrong, inactive):
            self.assertEqual(result.status_code, 401)
            self.assertEqual(result.data, unknown.data)

    def test_deactivation_blocks_refresh_as_well_as_login(self):
        refresh = str(RefreshToken.for_user(self.user))
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])
        response = self.client.post(reverse("token-refresh"), {"refresh": refresh})
        self.assertEqual(response.status_code, 401)

    def test_login_rate_limit_still_applies(self):
        for _ in range(20):
            self.assertEqual(self.login(password="wrong").status_code, 401)
        self.assertEqual(self.login(password="wrong").status_code, 429)

    def test_signup_saves_email_without_username_and_cannot_request_elevated_access(self):
        password = "  SpaceSafePass748!  "
        response = self.client.post(reverse("register"), {"email": "  NEW@EXAMPLE.COM  ",
            "first_name": "New", "last_name": "Account", "password": password, "password_confirm": password,
            "role": "admin", "is_active": True, "is_superuser": True}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertNotIn("username", response.data)
        self.assertNotIn("password", response.data)
        user = User.objects.get(email="new@example.com")
        self.assertEqual(user.role, "assistant")
        self.assertFalse(user.is_active or user.is_superuser or user.is_staff)
        self.assertTrue(user.check_password(password))
        self.assertEqual(self.login(user.email, password).status_code, 401)
        user.is_active = True
        user.save(update_fields=["is_active"])
        self.assertEqual(self.login(user.email.upper(), password).status_code, 200)
        self.assertEqual(self.login(user.email, password.strip()).status_code, 401)

    def test_signup_blocks_missing_invalid_duplicate_email_and_old_username_payload(self):
        base = {"password": PASSWORD, "password_confirm": PASSWORD}
        payloads = [base, base | {"email": ""}, base | {"email": "invalid"},
                    base | {"email": "  PRESENTER@EXAMPLE.COM  "},
                    base | {"email": "new@example.com", "username": "old-client"}]
        for payload in payloads:
            response = self.client.post(reverse("register"), payload, format="json")
            self.assertEqual(response.status_code, 400, response.data)
        self.assertEqual(User.objects.count(), 1)

    def test_signup_checks_password_confirmation_and_strength(self):
        for password, confirmation in ((PASSWORD, "different"), ("123", "123")):
            response = self.client.post(reverse("register"), {"email": "new@example.com",
                "password": password, "password_confirm": confirmation}, format="json")
            self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(User.objects.filter(email="new@example.com").exists())

    def test_profile_email_change_moves_login_to_new_email_without_replacing_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(reverse("current-user"), {"email": "  NEW-ADDRESS@EXAMPLE.COM  "})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["id"], self.user.pk)
        self.assertEqual(response.data["email"], "new-address@example.com")
        self.client.force_authenticate(None)
        self.assertEqual(self.login("presenter@example.com").status_code, 401)
        self.assertEqual(self.login("new-address@example.com").status_code, 200)

    def test_profile_cannot_remove_or_duplicate_its_login_email(self):
        User.objects.create_user("taken@example.com")
        self.client.force_authenticate(self.user)
        for email in ("", "  ", "invalid", " TAKEN@EXAMPLE.COM "):
            self.assertEqual(self.client.patch(reverse("current-user"), {"email": email}).status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "presenter@example.com")

    def test_only_admin_creates_email_only_staff_and_email_is_required(self):
        payload = {"email": "  STAFF@EXAMPLE.COM  ", "password": PASSWORD, "role": "presenter", "is_active": True}
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post("/api/auth/users/", payload).status_code, 403)
        administrator = User.objects.create_user("admin@example.com", role="admin")
        self.client.force_authenticate(administrator)
        response = self.client.post("/api/auth/users/", payload)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["email"], "staff@example.com")
        self.assertNotIn("username", response.data)
        for attrs in ({"email": ""}, {"email": "STAFF@example.com"}, {"username": "old"}):
            response = self.client.post("/api/auth/users/", payload | attrs)
            self.assertEqual(response.status_code, 400, response.data)
        missing = dict(payload)
        missing.pop("email")
        self.assertEqual(self.client.post("/api/auth/users/", missing).status_code, 400)
        for email in ("", "staff@EXAMPLE.COM"):
            self.assertEqual(self.client.patch(f"/api/auth/users/{self.user.pk}/", {"email": email}).status_code, 400)

    def test_staff_password_whitespace_is_preserved(self):
        administrator = User.objects.create_user("admin@example.com", role="admin")
        self.client.force_authenticate(administrator)
        password = "  StaffSafePass748!  "
        response = self.client.post("/api/auth/users/", {"email": "staff@example.com", "password": password,
                                                      "role": "presenter"})
        self.assertEqual(response.status_code, 201, response.data)
        user = User.objects.get(email="staff@example.com")
        self.assertTrue(user.check_password(password))
        replacement = "  ChangedStaffPass748!  "
        self.assertEqual(self.client.patch(f"/api/auth/users/{user.pk}/", {"password": replacement}).status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password(replacement))
