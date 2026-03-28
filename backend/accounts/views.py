from django.contrib.auth import get_user_model
from django.db.models import Sum
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from orders.models import Order
from products.models import Product
from .models import Address, Profile

from .serializers import (
    AdminUserSerializer,
    AddressSerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    RoleUpdateSerializer,
    UserProfileSerializer,
)


User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "Invalid refresh token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Logout successful."}, status=status.HTTP_200_OK)


class MeView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch", "put"]

    def get_object(self):
        Profile.objects.get_or_create(user=self.request.user)
        return User.objects.select_related("profile").prefetch_related("addresses").get(pk=self.request.user.pk)


class MyAddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by("-is_default", "id")


class MyAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


class SetDefaultAddressView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        address = generics.get_object_or_404(Address, pk=pk, user=request.user)
        Address.objects.filter(user=request.user, is_default=True).exclude(pk=address.pk).update(is_default=False)
        if not address.is_default:
            address.is_default = True
            address.save(update_fields=["is_default"])
        return Response(AddressSerializer(address, context={"request": request}).data, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().select_related("profile").order_by("id")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]


class UserDetailView(generics.RetrieveDestroyAPIView):
    queryset = User.objects.all().select_related("profile")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]


class UserRoleUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = RoleUpdateSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_revenue = Order.objects.aggregate(total=Sum("total_amount"))["total"] or 0

        return Response(
            {
                "total_users": User.objects.count(),
                "total_products": Product.objects.count(),
                "total_orders": Order.objects.count(),
                "total_revenue": float(total_revenue),
            },
            status=status.HTTP_200_OK,
        )
