from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


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
        return User.objects.create_user(**validated_data)


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

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "date_joined"]
        read_only_fields = ["id", "role", "date_joined"]

    def get_role(self, obj):
        return get_user_role(obj)


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
        data["user"] = AdminUserSerializer(self.user).data
        return data