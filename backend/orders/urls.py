from django.urls import path

from .views import OrderListCreateView, OrderRetrieveView


urlpatterns = [
    path("orders/", OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:order_id>/", OrderRetrieveView.as_view(), name="order-detail"),
]
