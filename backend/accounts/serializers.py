from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Address, Profile
User = get_user_model()

def get_user_role(user):
    return "Admin" if user.is_staff else "Customer"

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "confirm_password"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        user = User.objects.create_user(**validated_data)
        Profile.objects.get_or_create(user=user)
        return user


class AddressSerializer(serializers.ModelSerializer):
    full_address = serializers.CharField(source="get_full_address", read_only=True)

    class Meta:
        model = Address
        fields = [
            "id",
            "is_default",
            "country",
            "region",
            "city",
            "street",
            "postal_code",
            "full_address",
        ]
        read_only_fields = ["id", "full_address"]

    def create(self, validated_data):
        user = self.context["request"].user
        make_default = validated_data.get("is_default", False)
        if make_default:
            Address.objects.filter(user=user, is_default=True).update(is_default=False)
        elif not Address.objects.filter(user=user).exists():
            validated_data["is_default"] = True
        return Address.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        make_default = validated_data.get("is_default", instance.is_default)
        if make_default:
            Address.objects.filter(user=instance.user, is_default=True).exclude(pk=instance.pk).update(is_default=False)
        return super().update(instance, validated_data)


class ProfileSerializer(serializers.ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        avatar = data.get("avatar")
        request = self.context.get("request")
        if avatar and request and not avatar.startswith(("http://", "https://")):
            data["avatar"] = request.build_absolute_uri(avatar)
        return data

    class Meta:
        model = Profile
        fields = ["phone_number", "bio", "avatar"]

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
            "date_joined",
        ]
        read_only_fields = fields

    def get_role(self, obj):
        return get_user_role(obj)

class UserProfileSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField(read_only=True)
    profile = ProfileSerializer(read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    phone_number = serializers.CharField(source="profile.phone_number", required=False, allow_blank=True)
    bio = serializers.CharField(source="profile.bio", required=False, allow_blank=True)
    avatar = serializers.ImageField(source="profile.avatar", required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "date_joined",
            "phone_number",
            "bio",
            "avatar",
            "profile",
            "addresses",
        ]
        read_only_fields = ["id", "role", "date_joined"]

    def get_role(self, obj):
        return get_user_role(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        avatar = data.get("avatar")
        request = self.context.get("request")
        if avatar and request and not avatar.startswith(("http://", "https://")):
            data["avatar"] = request.build_absolute_uri(avatar)

        profile_data = data.get("profile")
        if isinstance(profile_data, dict):
            profile_avatar = profile_data.get("avatar")
            if profile_avatar and request and not profile_avatar.startswith(("http://", "https://")):
                profile_data["avatar"] = request.build_absolute_uri(profile_avatar)

        return data

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if profile_data:
            profile, _ = Profile.objects.get_or_create(user=instance)
            update_fields = []
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
                update_fields.append(attr)
            profile.save(update_fields=update_fields)

        return instance

class RoleUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[("Admin", "Admin"), ("Customer", "Customer")])

    def update(self, instance, validated_data):
        role = validated_data["role"]
        if role == "Admin":
            instance.is_staff = True
        else:
            instance.is_staff = False
            instance.is_superuser = False
        instance.save(update_fields=["is_staff", "is_superuser"])
        return instance

    def to_representation(self, instance):
        return AdminUserSerializer(instance).data


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["role"] = get_user_role(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserProfileSerializer(self.user, context={"request": self.context.get("request")}).data
        return data