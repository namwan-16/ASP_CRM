from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django import forms
from django.db import transaction
from django.core.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError

from .models import User
from .forms import EmailUserChangeForm, EmailUserCreationForm
from .permissions import is_admin
from .lifecycle import lock_staff, validate_staff_access
from config.lifecycle import staff_is_used


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    form = EmailUserChangeForm
    add_form = EmailUserCreationForm
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal details", {"fields": ("first_name", "last_name")}),
        ("Access", {"fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = ((None, {"classes": ("wide",), "fields": (
        "email", "first_name", "last_name", "password1", "password2", "role", "is_active", "is_staff",
    )}),)
    list_display = ("email", "first_name", "last_name", "role", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    list_filter = UserAdmin.list_filter + ("role",)

    def get_form(self, request, obj=None, **kwargs):
        base_form = super().get_form(request, obj, **kwargs)

        class AccessForm(base_form):
            def clean(self):
                data = super().clean()
                if obj and not self.errors:
                    try:
                        original = User.objects.get(pk=obj.pk)
                        validate_staff_access(original, data, request.user)
                        if obj.pk == request.user.pk and data.get("is_staff") is False:
                            raise ValidationError("You cannot remove your own administration access.")
                    except ValidationError as exc:
                        raise forms.ValidationError(str(exc.detail))
                return data

        return AccessForm

    @transaction.atomic
    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        if request.method == "POST":
            lock_staff()
        return super().changeform_view(request, object_id, form_url, extra_context)

    def has_add_permission(self, request):
        return is_admin(request.user) and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return is_admin(request.user) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return bool(obj and obj.pk != request.user.pk and not obj.is_superuser and not staff_is_used(obj)
                    and is_admin(request.user) and super().has_delete_permission(request, obj))

    def get_actions(self, request):
        actions = super().get_actions(request)
        actions.pop("delete_selected", None)
        return actions

    @transaction.atomic
    def delete_model(self, request, obj):
        lock_staff()
        obj = User.objects.select_for_update().get(pk=obj.pk)
        if not self.has_delete_permission(request, obj):
            raise PermissionDenied("Deactivate used accounts instead.")
        validate_staff_access(obj, {"is_active": False}, request.user)
        super().delete_model(request, obj)

