from django.contrib import admin
from .models import Cart, CartItem
class CartItemInline(admin.TabularInline):
	model = CartItem
	extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
	list_display = ["cart_id", "user", "total_items", "total_price", "updated_at"]
	search_fields = ["user__username", "user__email"]
	inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
	list_display = ["id", "cart", "product", "quantity", "subtotal", "updated_at"]
	list_filter = ["updated_at"]
	search_fields = ["cart__user__username", "product__name", "=product__id"]
