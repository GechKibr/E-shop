from django.contrib import admin

from .models import Category, Product
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("product_id", "name", "category", "price", "stock", "created_at", "updated_at")
    search_fields = ("name", "product_id")
    list_filter = ("category",)
