from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=Category.objects.all(),
        write_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "product_id",
            "name",
            "category",
            "category_id",
            "description",
            "price",
            "stock",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["product_id", "created_at", "updated_at"]
