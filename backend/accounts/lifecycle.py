from django.db import connection
from django.db.models import Q
from rest_framework import serializers

from .models import User
from .permissions import is_admin


def lock_staff():
    # Serializes admin-count checks on PostgreSQL, including admin-site changes.
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", [6202028])


def validate_staff_access(instance, attrs, actor):
    if not instance:
        return
    if instance.is_superuser and not actor.is_superuser:
        raise serializers.ValidationError("Only a superuser can change another superuser.")
    if instance.pk == actor.pk:
        if (attrs.get("is_active") is False or attrs.get("role", instance.role) != instance.role
                or (instance.is_superuser and attrs.get("is_superuser") is False)):
            raise serializers.ValidationError("You cannot deactivate yourself or remove your own admin access.")
    future_active = attrs.get("is_active", instance.is_active)
    future_admin = attrs.get("is_superuser", instance.is_superuser) or attrs.get("role", instance.role) == User.Role.ADMIN
    if is_admin(instance) and not (future_active and future_admin):
        if not User.objects.filter(is_active=True).filter(Q(role=User.Role.ADMIN) | Q(is_superuser=True)).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("The last active administrator cannot be deactivated or demoted.")
