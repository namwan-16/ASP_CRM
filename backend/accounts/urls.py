from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from rest_framework.routers import DefaultRouter
<<<<<<< HEAD
from .views import CurrentUserView, LogoutView, RegisterView, StaffViewSet, LoginView, PasswordChangeView
=======
from .views import CurrentUserView, LogoutView, RegisterView, StaffViewSet, LoginView
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

router = DefaultRouter()
router.register("users", StaffViewSet, basename="staff")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("change-password/", PasswordChangeView.as_view(), name="change-password"),
    path("logout/", LogoutView.as_view(), name="logout"),
] + router.urls

