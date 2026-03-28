from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser, IsAuthenticated, IsAuthenticatedOrReadOnly, SAFE_METHODS
from rest_framework.response import Response
from .models import Category, Product, ProductImage, ProductReview
from .serializers import (
	CategorySerializer,
	ProductImageSerializer,
	ProductReviewSerializer,
	ProductSerializer,
)


class IsAdminOrReadOnly(IsAuthenticatedOrReadOnly):
	def has_permission(self, request, view):
		if request.method in SAFE_METHODS:
			return True
		return bool(request.user and request.user.is_staff)


class CategoryListCreateView(generics.ListCreateAPIView):
	queryset = Category.objects.select_related("parent").all().order_by("name")
	serializer_class = CategorySerializer
	permission_classes = [IsAdminOrReadOnly]


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Category.objects.select_related("parent").all()
	serializer_class = CategorySerializer
	permission_classes = [IsAdminOrReadOnly]


class ProductListCreateView(generics.ListCreateAPIView):
	serializer_class = ProductSerializer
	permission_classes = [IsAdminOrReadOnly]

	def get_queryset(self):
		queryset = Product.objects.select_related("category").prefetch_related("images").annotate(
			average_rating_agg=Avg("reviews__rating"),
			reviews_count_agg=Count("reviews", distinct=True),
		).order_by("-created_at")

		search = self.request.query_params.get("search")
		category_id = self.request.query_params.get("category")
		is_active = self.request.query_params.get("is_active")
		in_stock = self.request.query_params.get("in_stock")
		min_price = self.request.query_params.get("min_price")
		max_price = self.request.query_params.get("max_price")

		if search:
			queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
		if category_id:
			queryset = queryset.filter(category_id=category_id)
		if is_active in {"true", "false"}:
			queryset = queryset.filter(is_active=(is_active == "true"))
		if in_stock in {"true", "false"}:
			if in_stock == "true":
				queryset = queryset.filter(stock_quantity__gt=0)
			else:
				queryset = queryset.filter(stock_quantity=0)
		if min_price:
			queryset = queryset.filter(price__gte=min_price)
		if max_price:
			queryset = queryset.filter(price__lte=max_price)

		return queryset


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Product.objects.select_related("category").prefetch_related("images").annotate(
		average_rating_agg=Avg("reviews__rating"),
		reviews_count_agg=Count("reviews", distinct=True),
	).all()
	serializer_class = ProductSerializer
	permission_classes = [IsAdminOrReadOnly]
	lookup_field = "pk"
	lookup_url_kwarg = "product_id"


class ProductImageListCreateView(generics.ListCreateAPIView):
	serializer_class = ProductImageSerializer
	permission_classes = [IsAdminOrReadOnly]

	def get_product(self):
		return get_object_or_404(Product, pk=self.kwargs["product_id"])

	def get_queryset(self):
		return ProductImage.objects.filter(product=self.get_product()).order_by("-is_primary", "id")

	def perform_create(self, serializer):
		serializer.save(product=self.get_product())


class ProductImageRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	serializer_class = ProductImageSerializer
	permission_classes = [IsAdminOrReadOnly]
	lookup_url_kwarg = "image_id"

	def get_product(self):
		return get_object_or_404(Product, pk=self.kwargs["product_id"])

	def get_queryset(self):
		return ProductImage.objects.filter(product=self.get_product())


class ProductImageSetPrimaryView(generics.UpdateAPIView):
	serializer_class = ProductImageSerializer
	permission_classes = [IsAdminUser]
	http_method_names = ["patch"]
	lookup_url_kwarg = "image_id"

	def get_product(self):
		return get_object_or_404(Product, pk=self.kwargs["product_id"])

	def get_queryset(self):
		return ProductImage.objects.filter(product=self.get_product())

	def patch(self, request, *args, **kwargs):
		image = self.get_object()
		image.set_as_primary()
		serializer = self.get_serializer(image)
		return Response(serializer.data)


class ProductReviewListCreateView(generics.ListCreateAPIView):
	serializer_class = ProductReviewSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]

	def get_product(self):
		return get_object_or_404(Product, pk=self.kwargs["product_id"])

	def get_queryset(self):
		product = self.get_product()
		return ProductReview.objects.filter(product=product).select_related("user", "product")

	def get_serializer_context(self):
		context = super().get_serializer_context()
		context["product"] = self.get_product()
		return context

	def perform_create(self, serializer):
		serializer.save(product=self.get_product(), user=self.request.user)


class ProductReviewRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	serializer_class = ProductReviewSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]
	lookup_url_kwarg = "review_id"

	def get_product(self):
		return get_object_or_404(Product, pk=self.kwargs["product_id"])

	def get_queryset(self):
		product = self.get_product()
		return ProductReview.objects.filter(product=product).select_related("user", "product")

	def perform_update(self, serializer):
		review = self.get_object()
		if review.user != self.request.user and not self.request.user.is_staff:
			raise PermissionDenied("You can only edit your own review.")
		serializer.save()

	def perform_destroy(self, instance):
		if instance.user != self.request.user and not self.request.user.is_staff:
			raise PermissionDenied("You can only delete your own review.")
		instance.delete()
