from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Address, Profile, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
	list_display = ["id", "username", "email", "first_name", "last_name", "is_staff", "is_active"]
	search_fields = ["username", "email", "first_name", "last_name"]
	ordering = ["id"]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
	list_display = ["id", "user", "country", "region", "city", "postal_code"]
	search_fields = ["user__username", "country", "region", "city", "postal_code"]
	list_filter = ["country", "region", "city"]
	ordering = ["id"]


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
	list_display = ["id", "user", "phone_number"]
	search_fields = ["user__username", "user__email", "phone_number"]
	ordering = ["id"]
