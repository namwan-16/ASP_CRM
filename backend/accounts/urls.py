from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from rest_framework.routers import DefaultRouter
from .views import CurrentUserView, LogoutView, RegisterView, StaffViewSet, LoginView

router = DefaultRouter()
router.register("users", StaffViewSet, basename="staff")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("logout/", LogoutView.as_view(), name="logout"),
] + router.urls

