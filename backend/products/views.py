from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .models import Category, Product, ProductReview
from .serializers import CategorySerializer, ProductReviewSerializer, ProductSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
	queryset = Category.objects.all().order_by("name")
	serializer_class = CategorySerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Category.objects.all()
	serializer_class = CategorySerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


class ProductListCreateView(generics.ListCreateAPIView):
	queryset = Product.objects.select_related("category").prefetch_related("reviews").all().order_by("-created_at")
	serializer_class = ProductSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Product.objects.select_related("category").prefetch_related("reviews").all()
	serializer_class = ProductSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]
	lookup_field = "product_id"


class ProductReviewListCreateView(generics.ListCreateAPIView):
	serializer_class = ProductReviewSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]

	def get_product(self):
		return get_object_or_404(Product, product_id=self.kwargs["product_id"])

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
		return get_object_or_404(Product, product_id=self.kwargs["product_id"])

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
