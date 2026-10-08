from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User
from .permissions import is_admin


class UserSerializer(serializers.ModelSerializer):
    can_manage = serializers.SerializerMethodField()

    def get_can_manage(self, obj):
        return is_admin(obj)

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "can_manage")
        read_only_fields = ("id", "role")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        )

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "The passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data, role=User.Role.ASSISTANT, is_active=False)
        user.set_password(password)
        user.save()
        return user


class StaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "role", "is_active", "password")
        read_only_fields = ("id",)

    def validate(self, attrs):
        user = self.instance or User(**{key: value for key, value in attrs.items() if key != "password"})
        if not self.instance and not attrs.get("password"):
            raise serializers.ValidationError({"password": "A password is required."})
        if attrs.get("password"):
            validate_password(attrs["password"], user=user)
        if self.instance and self.instance.is_superuser and not self.context["request"].user.is_superuser:
            raise serializers.ValidationError("Only a superuser can change another superuser.")
        if self.instance == self.context["request"].user:
            if attrs.get("is_active") is False or attrs.get("role", user.role) != user.role:
                raise serializers.ValidationError("You cannot deactivate or change your own role.")
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        return instance

