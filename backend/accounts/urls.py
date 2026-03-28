from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AdminDashboardView,
    LoginView,
    LogoutView,
    MeView,
    MyAddressDetailView,
    MyAddressListCreateView,
    RegisterView,
    SetDefaultAddressView,
    UserDetailView,
    UserListView,
    UserRoleUpdateView,
)


urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/addresses/", MyAddressListCreateView.as_view(), name="my-address-list-create"),
    path("users/me/addresses/<int:pk>/", MyAddressDetailView.as_view(), name="my-address-detail"),
    path("users/me/addresses/<int:pk>/set-default/", SetDefaultAddressView.as_view(), name="my-address-set-default"),
    path("users/", UserListView.as_view(), name="users-list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="users-detail"),
    path("users/<int:pk>/role/", UserRoleUpdateView.as_view(), name="users-role-update"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
]