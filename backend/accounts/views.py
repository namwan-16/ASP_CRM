from django.db import transaction
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import EmailTokenObtainPairSerializer, RegisterSerializer, UserSerializer, StaffSerializer, ProfileSerializer, PasswordChangeSerializer
from .models import User
from .permissions import AdminWrite, is_admin
from .lifecycle import lock_staff, validate_staff_access
from config.lifecycle import HistoryConflict, staff_is_used


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    throttle_scope = "auth"


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    throttle_scope = "auth"

    @transaction.atomic
    def post(self, request):
        user = User.objects.select_for_update().get(pk=request.user.pk)
        request.user = user
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)
        return Response({"detail": "Password changed. Sign in again with your new password."})


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
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    search_fields = ["email", "first_name", "last_name"]

    def get_queryset(self):
        qs = User.objects.order_by("first_name", "last_name", "email")
        return qs if is_admin(self.request.user) else qs.filter(is_active=True)

    def get_serializer_class(self):
        return StaffSerializer if is_admin(self.request.user) else UserSerializer

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        lock_staff()
        actor = User.objects.get(pk=request.user.pk)
        if not is_admin(actor):
            raise PermissionDenied("Administrator access is required.")
        self.get_object()
        instance = User.objects.select_for_update().get(pk=kwargs["pk"])
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop("partial", False))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @transaction.atomic
    def perform_destroy(self, instance):
        lock_staff()
        instance = User.objects.select_for_update().get(pk=instance.pk)
        validate_staff_access(instance, {"is_active": False}, self.request.user)
        if instance.is_superuser or staff_is_used(instance):
            raise HistoryConflict("This account has been used or has class/note history. Deactivate it instead.")
        instance.delete()

