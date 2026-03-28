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

from .serializers import (
    AdminUserSerializer,
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

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("id")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]


class UserDetailView(generics.RetrieveDestroyAPIView):
    queryset = User.objects.all()
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
        total_revenue = Order.objects.aggregate(total=Sum("total_price"))["total"] or 0

        return Response(
            {
                "total_users": User.objects.count(),
                "total_products": Product.objects.count(),
                "total_orders": Order.objects.count(),
                "total_revenue": float(total_revenue),
            },
            status=status.HTTP_200_OK,
        )
