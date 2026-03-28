from rest_framework import serializers

from .models import Category, Product, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "description"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    product_image_file_url = serializers.SerializerMethodField(read_only=True)
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
            "product_image",
            "product_image_file",
            "product_image_file_url",
            "description",
            "price",
            "stock",
            "average_rating",
            "reviews_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["product_id", "created_at", "updated_at"]

    def get_average_rating(self, obj):
        reviews_qs = getattr(obj, "reviews", None)
        if reviews_qs is None:
            return 0.0

        if hasattr(reviews_qs, "all"):
            reviews = reviews_qs.all()
            if not reviews:
                return 0.0
            total = sum(review.rating for review in reviews)
            return round(total / len(reviews), 2)

        return 0.0

    def get_reviews_count(self, obj):
        reviews_qs = getattr(obj, "reviews", None)
        if reviews_qs is None:
            return 0

        if hasattr(reviews_qs, "count"):
            return reviews_qs.count()

        return 0

    def get_product_image_file_url(self, obj):
        if not obj.product_image_file:
            return ""

        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.product_image_file.url)

        return obj.product_image_file.url

    def validate(self, attrs):
        product_image = attrs.get("product_image")
        product_image_file = attrs.get("product_image_file")

        if self.instance is not None:
            has_existing_url = bool(self.instance.product_image)
            has_existing_file = bool(self.instance.product_image_file)
        else:
            has_existing_url = False
            has_existing_file = False

        if not (product_image or product_image_file or has_existing_url or has_existing_file):
            raise serializers.ValidationError(
                {"product_image": "Provide either image URL or uploaded image file."}
            )

        return attrs


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = ProductReview
        fields = [
            "id",
            "product",
            "user",
            "user_name",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "product", "user", "user_name", "created_at", "updated_at"]

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
