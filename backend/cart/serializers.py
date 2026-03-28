from rest_framework import serializers
from products.models import Product
from .models import Cart, CartItem, Wishlist, WishlistItem


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField(read_only=True)
    stock_available = serializers.IntegerField(source="product.stock_quantity", read_only=True)
    is_active = serializers.BooleanField(source="product.is_active", read_only=True)
    subtotal = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_id",
            "product_slug",
            "product_name",
            "price",
            "product_image",
            "stock_available",
            "is_active",
            "quantity",
            "subtotal",
            "added_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "added_at",
            "updated_at",
            "product_id",
            "product_slug",
            "product_name",
            "price",
            "product_image",
            "stock_available",
            "is_active",
            "subtotal",
        ]

    def get_product_image(self, obj):
        return obj.product.get_primary_image() or ""

    def get_subtotal(self, obj):
        return obj.subtotal


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        product_id = attrs["product_id"]
        quantity = attrs["quantity"]

        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError({"product_id": "Product does not exist."}) from exc

        if not product.is_active:
            raise serializers.ValidationError({"product_id": "This product is currently inactive."})

        if product.stock_quantity < 1:
            raise serializers.ValidationError({"product_id": "This product is out of stock."})

        attrs["product"] = product
        attrs["requested_quantity"] = quantity
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = Cart
        fields = ["cart_id", "user", "user_id", "items", "total_items", "total_price", "created_at", "updated_at"]
        read_only_fields = ["cart_id", "user", "user_id", "items", "total_items", "total_price", "created_at", "updated_at"]


class WishlistItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
    product_image = serializers.SerializerMethodField(read_only=True)
    in_stock = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = WishlistItem
        fields = [
            "id",
            "wishlist",
            "product",
            "product_id",
            "product_name",
            "product_slug",
            "product_price",
            "product_image",
            "in_stock",
            "added_at",
        ]
        read_only_fields = [
            "id",
            "wishlist",
            "product",
            "product_id",
            "product_name",
            "product_slug",
            "product_price",
            "product_image",
            "in_stock",
            "added_at",
        ]

    def get_product_image(self, obj):
        return obj.product.get_primary_image() or ""

    def get_in_stock(self, obj):
        return obj.product.stock_quantity > 0


class WishlistSerializer(serializers.ModelSerializer):
    wishlist_id = serializers.IntegerField(source="id", read_only=True)
    items = WishlistItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Wishlist
        fields = ["wishlist_id", "user", "items", "item_count", "created_at", "updated_at"]
        read_only_fields = fields

    def get_item_count(self, obj):
        return obj.items.count()


class WishlistAddItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(pk=value)
        except Product.DoesNotExist as exc:
            raise serializers.ValidationError("Product does not exist.") from exc

        if not product.is_active:
            raise serializers.ValidationError("Inactive products cannot be added to wishlist.")

        self.context["product"] = product
        return value
