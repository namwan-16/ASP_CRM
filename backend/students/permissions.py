from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    message = (
        "Only an ASP CRM administrator "
        "can import student records."
    )

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.is_superuser
                or getattr(user, "role", "") == "admin"
            )
        )