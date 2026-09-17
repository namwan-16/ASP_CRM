from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
# Register your models here.

class UserAdmin(UserAdmin):

    fieldsets = UserAdmin.fieldsets + (
        ('ASP CRM Role', {
            'fields': ('role', 'phone_number')
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('ASP CRM Role', {
            'fields': ('role', 'phone_number')
        }),
    )

admin.site.register(User, UserAdmin)