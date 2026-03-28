from django.contrib import admin
from .models import Category, Product, ProductImage, ProductReview

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug', 'parent']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['id']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'price', 'stock_quantity', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['category', 'is_active']
    ordering = ['id']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'image_url', 'is_primary']
    search_fields = ['product__name']
    list_filter = ['is_primary']
    ordering = ['id']

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'user', 'rating', 'comment', 'created_at']
    search_fields = ['product__name', 'user__username']
    list_filter = ['rating']
    ordering = ['id']