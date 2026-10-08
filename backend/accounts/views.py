from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import RegisterSerializer, UserSerializer, StaffSerializer
from .models import User
from .permissions import AdminWrite, is_admin


class LoginView(TokenObtainPairView):
    throttle_scope = "auth"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    def post(self, request):
        refresh_value = request.data.get("refresh")
        if not refresh_value:
            return Response(
                {"detail": "A refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_value)
            if str(token["user_id"]) != str(request.user.pk):
                return Response({"detail": "This token belongs to a different account."}, status=400)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "The refresh token is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_205_RESET_CONTENT)


class StaffViewSet(viewsets.ModelViewSet):
    permission_classes = [AdminWrite]
    http_method_names = ["get", "post", "patch", "head", "options"]
    search_fields = ["username", "first_name", "last_name"]

    def get_queryset(self):
        qs = User.objects.order_by("first_name", "last_name", "username")
        return qs if is_admin(self.request.user) else qs.filter(is_active=True)

    def get_serializer_class(self):
        return StaffSerializer if is_admin(self.request.user) else UserSerializer

