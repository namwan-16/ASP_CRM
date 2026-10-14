from django.contrib import admin
from accounts.permissions import is_admin


class AdminManagedModelAdmin(admin.ModelAdmin):
    """Django model permissions never grant a presenter CRM management rights."""
    def has_add_permission(self, request):
        return is_admin(request.user) and super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        return is_admin(request.user) and super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        return is_admin(request.user) and super().has_delete_permission(request, obj)
