from django.contrib.auth.password_validation import validate_password
from django.db.models.functions import Lower, Trim
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User
from .permissions import is_admin
<<<<<<< HEAD


def validate_login_email(value, instance=None):
    email = User.objects.normalize_email(value)
    accounts = User.objects.annotate(login_email=Lower(Trim("email"))).filter(login_email=email)
    if instance:
        accounts = accounts.exclude(pk=instance.pk)
    if accounts.exists():
        raise serializers.ValidationError("This email is already used by another account.")
    return email


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "Unable to sign in with this email and password. Check your details and account approval.",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["email"] = serializers.EmailField(write_only=True)
        self.fields["password"].trim_whitespace = False

    def validate(self, attrs):
        attrs["email"] = User.objects.normalize_email(attrs["email"])
        return super().validate(attrs)
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b


class UserSerializer(serializers.ModelSerializer):
    can_manage = serializers.SerializerMethodField()

    def get_can_manage(self, obj):
        return is_admin(obj)

    class Meta:
        model = User
<<<<<<< HEAD
        fields = ("id", "email", "first_name", "last_name", "role", "can_manage")
=======
        fields = ("id", "username", "email", "first_name", "last_name", "role", "can_manage")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        read_only_fields = ("id", "role")


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        )

    def validate_email(self, value):
        return validate_login_email(value)

    def validate(self, attrs):
        if "username" in self.initial_data:
            raise serializers.ValidationError({"username": "Use email instead. Usernames are no longer supported."})
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "The passwords do not match."}
            )
        validate_password(attrs["password"], user=User(**{key: value for key, value in attrs.items() if key not in {"password", "password_confirm"}}))
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
<<<<<<< HEAD
        return User.objects.create_user(**validated_data, role=User.Role.ASSISTANT, is_active=False)


class StaffSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, allow_blank=False)
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    can_delete = serializers.SerializerMethodField()

    def get_can_delete(self, obj):
        from config.lifecycle import staff_is_used
        return obj.pk != self.context["request"].user.pk and not obj.is_superuser and not staff_is_used(obj)

    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "role", "is_active", "is_superuser", "password", "can_delete")
        read_only_fields = ("id", "is_superuser")

    def validate_email(self, value):
        return validate_login_email(value, self.instance)

    def validate(self, attrs):
        if "username" in self.initial_data:
            raise serializers.ValidationError({"username": "Use email instead. Usernames are no longer supported."})
=======
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
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        user = self.instance or User(**{key: value for key, value in attrs.items() if key != "password"})
        if not self.instance and not attrs.get("password"):
            raise serializers.ValidationError({"password": "A password is required."})
        if attrs.get("password"):
            validate_password(attrs["password"], user=user)
<<<<<<< HEAD
        from .lifecycle import validate_staff_access
        validate_staff_access(self.instance, attrs, self.context["request"].user)
=======
        if self.instance and self.instance.is_superuser and not self.context["request"].user.is_superuser:
            raise serializers.ValidationError("Only a superuser can change another superuser.")
        if self.instance == self.context["request"].user:
            if attrs.get("is_active") is False or attrs.get("role", user.role) != user.role:
                raise serializers.ValidationError("You cannot deactivate or change your own role.")
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
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

<<<<<<< HEAD


class ProfileSerializer(UserSerializer):
    email = serializers.EmailField(required=True, allow_blank=False)

    class Meta(UserSerializer.Meta):
        read_only_fields = ("id", "role", "can_manage")

    def validate_email(self, value):
        return validate_login_email(value, self.instance)

    def validate(self, attrs):
        unsupported = set(self.initial_data) - {"first_name", "last_name", "email"}
        if unsupported:
            raise serializers.ValidationError("Only your first name, last name and email can be changed here.")
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError({"current_password": "Your current password is incorrect."})
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({"new_password_confirm": "The new passwords do not match."})
        if user.check_password(attrs["new_password"]):
            raise serializers.ValidationError({"new_password": "Choose a different password."})
        validate_password(attrs["new_password"], user=user)
        return attrs
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
