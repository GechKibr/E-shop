"""
Payment App URLs
"""
from django.urls import path
from .views import PaymentInitiateView, payment_webhook, PaymentStatusView

app_name = "payment"

urlpatterns = [
    path("initiate/<int:order_id>/", PaymentInitiateView.as_view(), name="payment-initiate"),
    # Webhook callback from Chapa
    path("webhook/", payment_webhook, name="payment-webhook"),
    path("order/<int:order_id>/status/", PaymentStatusView.as_view(), name="payment-status"),
]
