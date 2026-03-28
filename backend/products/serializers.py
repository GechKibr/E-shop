import os
import uuid

from django.core.files.storage import default_storage
from django.db.models import Avg, Count
from rest_framework import serializers

from .models import Category, Product, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent",
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "parent_id"]
        read_only_fields = ["id", "slug", "parent"]


class ProductImageSerializer(serializers.ModelSerializer):
    product_id = serializers.CharField(source="product.pk", read_only=True)

    class Meta:
        model = ProductImage
        fields = ["id", "product_id", "image_url", "is_primary"]
        read_only_fields = ["id", "product_id"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    is_in_stock = serializers.SerializerMethodField()
    product_id = serializers.CharField(source="pk", read_only=True)
    product_image = serializers.SerializerMethodField()
    product_image_file = serializers.ImageField(write_only=True, required=False, allow_null=True)
    product_image_file_url = serializers.SerializerMethodField(read_only=True)
    stock = serializers.IntegerField(source="stock_quantity")
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
            "slug",
            "category",
            "category_id",
            "product_image",
            "product_image_file",
            "product_image_file_url",
            "images",
            "description",
            "price",
            "stock",
            "is_active",
            "is_in_stock",
            "average_rating",
            "reviews_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["product_id", "slug", "product_image", "product_image_file_url", "is_in_stock", "created_at", "updated_at"]

    def get_average_rating(self, obj):
        if hasattr(obj, "average_rating_agg") and obj.average_rating_agg is not None:
            return round(float(obj.average_rating_agg), 2)
        stats = ProductReview.objects.filter(product=obj).aggregate(avg=Avg("rating"))
        avg = stats["avg"]
        return round(float(avg), 2) if avg is not None else 0.0

    def get_reviews_count(self, obj):
        if hasattr(obj, "reviews_count_agg") and obj.reviews_count_agg is not None:
            return int(obj.reviews_count_agg)
        return ProductReview.objects.filter(product=obj).aggregate(total=Count("id"))["total"] or 0

    def get_is_in_stock(self, obj):
        return obj.is_in_stock()

    def get_product_image(self, obj):
        return obj.get_primary_image() or ""

    def get_product_image_file_url(self, obj):
        return obj.get_primary_image() or ""

    def validate(self, attrs):
        product_image_file = attrs.get("product_image_file")

        product_image = attrs.get("product_image")
        if product_image is None:
            product_image = self.initial_data.get("product_image")

        has_existing_url = bool(self.instance and self.instance.get_primary_image())

        if not (product_image or product_image_file or has_existing_url):
            raise serializers.ValidationError(
                {"product_image": "Provide product_image URL or upload product_image_file."}
            )

        return attrs

    def _save_uploaded_file(self, uploaded_file):
        ext = os.path.splitext(uploaded_file.name)[1] or ".jpg"
        filename = f"products/{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(filename, uploaded_file)
        file_url = default_storage.url(saved_path)

        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(file_url)
        return file_url

    def _set_primary_image(self, instance, image_url):
        if not image_url:
            return

        ProductImage.objects.filter(product=instance).update(is_primary=False)
        ProductImage.objects.update_or_create(
            product=instance,
            image_url=image_url,
            defaults={"is_primary": True},
        )

    def create(self, validated_data):
        image_file = validated_data.pop("product_image_file", None)
        image_url = self.initial_data.get("product_image")
        if image_file is not None:
            image_url = self._save_uploaded_file(image_file)

        product = super().create(validated_data)
        self._set_primary_image(product, image_url)
        return product

    def update(self, instance, validated_data):
        image_file = validated_data.pop("product_image_file", None)
        image_url = self.initial_data.get("product_image")
        if image_file is not None:
            image_url = self._save_uploaded_file(image_file)

        product = super().update(instance, validated_data)
        self._set_primary_image(product, image_url)
        return product


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    product_id = serializers.CharField(source="product.pk", read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "product",
            "product_id",
            "user",
            "user_name",
            "rating",
            "comment",
            "created_at",
        ]
        read_only_fields = ["id", "product", "product_id", "user", "user_name", "created_at"]

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate(self, attrs):
        request = self.context.get("request")
        product = self.context.get("product")

        if request and request.method == "POST" and product:
            if ProductReview.objects.filter(product=product, user=request.user).exists():
                raise serializers.ValidationError("You have already reviewed this product.")

        return attrs
