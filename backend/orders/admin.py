from django.contrib import admin
from .models import Order, OrderItem, OrderStatus, OrderStatusHistory
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "status", "total_amount", "created_at"]
    search_fields = ["user__username", "user__email"]
    list_filter = ["status", "created_at"]
    ordering = ["id"]

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "product", "quantity", "price_at_purchase"]
    search_fields = ["order__id", "product__name"]
    list_filter = ["order__status"]
    ordering = ["id"]

@admin.register(OrderStatus)
class OrderStatusAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "slug", "is_terminal"]
    search_fields = ["name", "slug"]
    ordering = ["id"]

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "status", "changed_at", "changed_by"]
    search_fields = ["order__id", "status__name", "changed_by__username"]
    list_filter = ["status", "changed_at"]
    ordering = ["id"]
