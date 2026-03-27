from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from products.models import Product
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source="product.product_id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_id", "product_name", "quantity", "price"]
        read_only_fields = ["id", "product", "product_id", "product_name", "quantity", "price"]

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ["order_id", "user", "total_price", "items", "created_at", "updated_at"]
        read_only_fields = ["order_id", "user", "total_price", "items", "created_at", "updated_at"]

class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.CharField(max_length=20)
    quantity = serializers.IntegerField(min_value=1)

class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemCreateSerializer(many=True, allow_empty=False)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Order must include at least one item.")

        product_ids = [item["product_id"] for item in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("Duplicate products are not allowed. Combine quantities per product.")

        return value

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        requested_items = validated_data["items"]

        product_ids = [item["product_id"] for item in requested_items]
        products = Product.objects.select_for_update().filter(product_id__in=product_ids)
        products_by_id = {product.product_id: product for product in products}

        missing_product_ids = [product_id for product_id in product_ids if product_id not in products_by_id]
        if missing_product_ids:
            raise serializers.ValidationError({"items": f"Products not found: {', '.join(missing_product_ids)}"})

        order = Order.objects.create(user=user, total_price=Decimal("0.00"))
        order_items_to_create = []
        total_price = Decimal("0.00")

        for requested_item in requested_items:
            product = products_by_id[requested_item["product_id"]]
            quantity = requested_item["quantity"]

            if quantity > product.stock:
                raise serializers.ValidationError(
                    {"items": f"Requested quantity for '{product.name}' exceeds available stock."}
                )

            order_items_to_create.append(
                OrderItem(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price=product.price,
                )
            )
            total_price += product.price * quantity

            product.stock -= quantity
            product.save(update_fields=["stock", "updated_at"])

        OrderItem.objects.bulk_create(order_items_to_create)
        order.total_price = total_price
        order.save(update_fields=["total_price", "updated_at"])

        return order
