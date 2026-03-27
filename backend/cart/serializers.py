from rest_framework import serializers
from products.models import Product
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "price",
            "quantity",
            "subtotal",
            "added_at",
            "updated_at",
        ]
        read_only_fields = ["id", "added_at", "updated_at", "product_name", "price", "subtotal"]

    def get_subtotal(self, obj):
        return obj.subtotal


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=20)
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product does not exist.")
        return value


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["cart_id", "user", "items", "total_items", "total_price", "created_at", "updated_at"]
        read_only_fields = ["cart_id", "user", "items", "total_items", "total_price", "created_at", "updated_at"]
