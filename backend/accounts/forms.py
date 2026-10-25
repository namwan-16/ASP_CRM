from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm
from django.core.exceptions import ValidationError
from django.db.models.functions import Lower, Trim

from .models import User


class LoginEmailFormMixin:
    def clean_email(self):
        email = User.objects.normalize_email(self.cleaned_data["email"])
        accounts = User.objects.annotate(login_email=Lower(Trim("email"))).filter(login_email=email)
        if self.instance.pk:
            accounts = accounts.exclude(pk=self.instance.pk)
        if accounts.exists():
            raise ValidationError("This email is already used by another account.")
        return email


class EmailUserCreationForm(LoginEmailFormMixin, BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "role")


class EmailUserChangeForm(LoginEmailFormMixin, UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"
