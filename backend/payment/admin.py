from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "tx_ref", "order", "amount", "status", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["tx_ref", "order__id"]
    readonly_fields = ["tx_ref", "created_at", "updated_at", "chapa_response"]
    fieldsets = (
        ("Payment Info", {
            "fields": ("order", "tx_ref", "amount", "status")
        }),
        ("Chapa Response", {
            "fields": ("chapa_response",),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
