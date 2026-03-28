from django.urls import path

from .views import OrderListCreateView, OrderRetrieveView, OrderStatusListView, OrderStatusUpdateView


urlpatterns = [
    path("orders/", OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:order_id>/", OrderRetrieveView.as_view(), name="order-detail"),
    path("orders/statuses/", OrderStatusListView.as_view(), name="order-status-list"),
    path("orders/<int:order_id>/status/", OrderStatusUpdateView.as_view(), name="order-status-update"),
]
