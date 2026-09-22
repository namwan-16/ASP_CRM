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

