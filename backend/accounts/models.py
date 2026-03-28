from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.username


class Address(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    is_default = models.BooleanField(default=False)
    country = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    street = models.CharField(max_length=255)
    postal_code = models.CharField(max_length=20)

    class Meta:
        ordering = ["-is_default", "id"]

    def __str__(self):
        return f"{self.user.username} - {self.city}, {self.country}"

    def get_full_address(self):
        return f"{self.street}, {self.city}, {self.region}, {self.country}, {self.postal_code}"


class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    phone_number = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True)
    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.user.username}'s Profile"