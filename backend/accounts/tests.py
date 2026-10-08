from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class AuthenticationApiTests(APITestCase):
    def test_registration_login_and_current_user(self):
        registration = self.client.post(
            reverse("register"),
            {
                "username": "testassistant",
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
            get_user_model().objects.get(username="testassistant").role,
            "assistant",
        )
        user = get_user_model().objects.get(username="testassistant")
        self.assertFalse(user.is_active)
        blocked = self.client.post(reverse("login"), {"username": "testassistant", "password": "SafeTestPassword483!"})
        self.assertEqual(blocked.status_code, status.HTTP_401_UNAUTHORIZED)
        user.is_active = True
        user.save()

        login = self.client.post(
            reverse("login"),
            {"username": "testassistant", "password": "SafeTestPassword483!"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access", login.data)
        self.assertIn("refresh", login.data)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        current_user = self.client.get(reverse("current-user"))
        self.assertEqual(current_user.status_code, status.HTTP_200_OK)
        self.assertEqual(current_user.data["username"], "testassistant")
        self.assertEqual(current_user.data["role"], "assistant")

    def test_current_user_requires_authentication(self):
        response = self.client.get(reverse("current-user"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_role_changes_require_admin(self):
        User = get_user_model()
        assistant = User.objects.create_user("assistant", password="SafeTestPassword483!")
        admin = User.objects.create_user("admin", role="admin", password="SafeTestPassword483!")
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
        admin = User.objects.create_user("admin", role="admin")
        root = User.objects.create_superuser("root", password="SafeTestPassword483!")
        self.client.force_authenticate(admin)
        self.assertEqual(self.client.patch(f"/api/auth/users/{admin.pk}/", {"is_active": False}).status_code, 400)
        self.assertEqual(self.client.patch(f"/api/auth/users/{root.pk}/", {"role": "assistant"}).status_code, 400)

    def test_logout_cannot_blacklist_another_users_refresh_token(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        User = get_user_model()
        first = User.objects.create_user("first")
        second = User.objects.create_user("second")
        self.client.force_authenticate(first)
        response = self.client.post(reverse("logout"), {"refresh": str(RefreshToken.for_user(second))})
        self.assertEqual(response.status_code, 400)

