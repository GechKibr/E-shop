from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from products.models import Product

from .models import Order, OrderItem, OrderStatus, OrderStatusHistory


class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = ["id", "name", "slug", "description", "color_hex", "is_terminal"]
        read_only_fields = fields


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status = OrderStatusSerializer(read_only=True)
    changed_by_username = serializers.CharField(source="changed_by.username", read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ["id", "status", "changed_at", "changed_by", "changed_by_username"]
        read_only_fields = fields


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    price = serializers.DecimalField(source="price_at_purchase", max_digits=10, decimal_places=2, read_only=True)
    line_total = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_id", "product_name", "quantity", "price", "line_total"]
        read_only_fields = ["id", "product", "product_id", "product_name", "quantity", "price", "line_total"]

    def get_line_total(self, obj):
        return obj.get_total_price()


class OrderSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="id", read_only=True)
    total_price = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2, read_only=True)
    status = OrderStatusSerializer(read_only=True)
    status_slug = serializers.CharField(source="status.slug", read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "order_id",
            "user",
            "status",
            "status_slug",
            "total_price",
            "items",
            "status_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
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
        products = Product.objects.select_for_update().filter(id__in=product_ids)
        products_by_id = {product.id: product for product in products}

        missing_product_ids = [str(product_id) for product_id in product_ids if product_id not in products_by_id]
        if missing_product_ids:
            raise serializers.ValidationError({"items": f"Products not found: {', '.join(missing_product_ids)}"})

        pending_status, _ = OrderStatus.objects.get_or_create(
            slug="pending",
            defaults={"name": "Pending", "description": "Order placed and pending processing."},
        )
        order = Order.objects.create(user=user, status=pending_status, total_amount=Decimal("0.00"))
        order_items_to_create = []
        total_price = Decimal("0.00")

        for requested_item in requested_items:
            product = products_by_id[requested_item["product_id"]]
            quantity = requested_item["quantity"]

            if not product.is_active:
                raise serializers.ValidationError({"items": f"'{product.name}' is inactive and cannot be ordered."})

            if quantity > product.stock_quantity:
                raise serializers.ValidationError(
                    {"items": f"Requested quantity for '{product.name}' exceeds available stock."}
                )

            order_items_to_create.append(
                OrderItem(
                    order=order,
                    product=product,
                    quantity=quantity,
                    price_at_purchase=product.price,
                )
            )
            total_price += product.price * quantity

            product.stock_quantity -= quantity
            product.save(update_fields=["stock_quantity", "updated_at"])

        OrderItem.objects.bulk_create(order_items_to_create)
        order.total_amount = total_price
        order.save(update_fields=["total_amount", "updated_at"])

        OrderStatusHistory.objects.create(order=order, status=pending_status, changed_by=user)

        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    status_slug = serializers.SlugField(max_length=50)

    def validate_status_slug(self, value):
        if not OrderStatus.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Invalid status slug.")
        return value

    def update(self, instance, validated_data):
        user = self.context["request"].user
        instance.update_status(validated_data["status_slug"], user=user)
        return instance

    def to_representation(self, instance):
        return OrderSerializer(instance).data
