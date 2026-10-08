from django.db.models import Q
from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_admin(user):
    return user.is_authenticated and user.is_active and (user.is_superuser or user.role == "admin")


class AdminOnly(BasePermission):
    def has_permission(self, request, view):
        return is_admin(request.user)


class AdminWrite(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active and (
            request.method in SAFE_METHODS or is_admin(request.user)
        )


def assigned_sessions(user):
    from classes.models import ClassSession
    qs = ClassSession.objects.all()
    if not is_admin(user):
        qs = qs.filter(Q(presenter=user) | Q(assistant=user))
    return qs


def visible_students(user):
    from students.models import Student
    qs = Student.objects.all()
    if not is_admin(user):
        qs = qs.filter(class_sessions__in=assigned_sessions(user)).distinct()
    return qs
