from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthenticationApiTests(APITestCase):
    def test_registration_login_and_current_user(self):
        registration = self.client.post(
            reverse("register"),
            {
                "email": "assistant@example.com",
                "first_name": "Test",
                "last_name": "Assistant",
                "password": "SafeTestPassword483!",
                "password_confirm": "SafeTestPassword483!",
            },
            format="json",
        )
        self.assertEqual(registration.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            get_user_model().objects.get(email="assistant@example.com").role,
            "assistant",
        )
        user = get_user_model().objects.get(email="assistant@example.com")
        self.assertFalse(user.is_active)
        blocked = self.client.post(reverse("login"), {"email": "assistant@example.com", "password": "SafeTestPassword483!"})
        self.assertEqual(blocked.status_code, status.HTTP_401_UNAUTHORIZED)
        user.is_active = True
        user.save()

        login = self.client.post(
            reverse("login"),
            {"email": "assistant@example.com", "password": "SafeTestPassword483!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access", login.data)
        self.assertIn("refresh", login.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        current_user = self.client.get(reverse("current-user"))
        self.assertEqual(current_user.status_code, status.HTTP_200_OK)
        self.assertEqual(current_user.data["email"], "assistant@example.com")
        self.assertEqual(current_user.data["role"], "assistant")

    def test_current_user_requires_authentication(self):
        response = self.client.get(reverse("current-user"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_role_changes_require_admin(self):
        User = get_user_model()
        assistant = User.objects.create_user("assistant@example.test", password="SafeTestPassword483!")
        admin = User.objects.create_user("admin@example.test", role="admin", password="SafeTestPassword483!")
        self.client.force_authenticate(assistant)
        response = self.client.patch(f"/api/auth/users/{assistant.pk}/", {"role": "admin"})
        self.assertEqual(response.status_code, 403)
        self.client.force_authenticate(admin)
        response = self.client.patch(f"/api/auth/users/{assistant.pk}/", {"role": "presenter"})
        self.assertEqual(response.status_code, 200)
        assistant.refresh_from_db()
        self.assertEqual(assistant.role, "presenter")

    def test_admin_cannot_deactivate_self_or_modify_superuser(self):
        User = get_user_model()
        admin = User.objects.create_user("admin@example.test", role="admin")
        root = User.objects.create_superuser("root@example.test", password="SafeTestPassword483!")
        self.client.force_authenticate(admin)
        self.assertEqual(self.client.patch(f"/api/auth/users/{admin.pk}/", {"is_active": False}).status_code, 400)
        self.assertEqual(self.client.patch(f"/api/auth/users/{root.pk}/", {"role": "assistant"}).status_code, 400)

    def test_logout_cannot_blacklist_another_users_refresh_token(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        User = get_user_model()
        first = User.objects.create_user("first@example.test")
        second = User.objects.create_user("second@example.test")
        self.client.force_authenticate(first)
        response = self.client.post(reverse("logout"), {"refresh": str(RefreshToken.for_user(second))})
        self.assertEqual(response.status_code, 400)



class ProfileApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("profile@example.com", password="OriginalSafePass784!")
        self.client.force_authenticate(self.user)

    def test_self_profile_and_protected_fields(self):
        r = self.client.patch(reverse("current-user"), {"first_name": "Nam", "last_name": "Wangchuk", "email": "nam@example.com"})
        self.assertEqual(r.status_code, 200, r.data)
        self.user.refresh_from_db(); self.assertEqual(self.user.first_name, "Nam")
        for field, value in (("role", "admin"), ("username", "other"), ("is_active", True), ("password", "anything")):
            self.assertEqual(self.client.patch(reverse("current-user"), {field: value}).status_code, 400)
        get_user_model().objects.create_user("taken@example.com")
        self.assertEqual(self.client.patch(reverse("current-user"), {"email": "TAKEN@example.com"}).status_code, 400)
        self.assertEqual(self.client.patch(reverse("current-user"), {"email": "invalid"}).status_code, 400)

    def test_password_validation(self):
        base = {"current_password": "OriginalSafePass784!", "new_password": "NewSafePass542!", "new_password_confirm": "NewSafePass542!"}
        for fields in ({"current_password": "wrong"}, {"new_password_confirm": "different"}, {"new_password": "123", "new_password_confirm": "123"}):
            self.assertEqual(self.client.post(reverse("change-password"), base | fields).status_code, 400)
        self.user.refresh_from_db(); self.assertTrue(self.user.check_password(base["current_password"]))
        self.assertEqual(self.client.post(reverse("change-password"), base).status_code, 200)
        self.user.refresh_from_db(); self.assertTrue(self.user.check_password(base["new_password"]))

    def test_old_access_and_refresh_revoked(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        token = RefreshToken.for_user(self.user)
        access, refresh = str(token.access_token), str(token)
        self.client.force_authenticate(user=None)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        r = self.client.post(reverse("change-password"), {"current_password": "OriginalSafePass784!", "new_password": "NewSafePass542!", "new_password_confirm": "NewSafePass542!"})
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(self.client.get(reverse("current-user")).status_code, 401)
        self.client.credentials()
        self.assertEqual(self.client.post(reverse("token-refresh"), {"refresh": refresh}).status_code, 401)
        self.assertEqual(self.client.post(reverse("login"), {"email": self.user.email, "password": "NewSafePass542!"}).status_code, 200)
