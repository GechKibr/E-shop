from rest_framework import generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
	queryset = Category.objects.all().order_by("name")
	serializer_class = CategorySerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


class CategoryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Category.objects.all()
	serializer_class = CategorySerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


class ProductListCreateView(generics.ListCreateAPIView):
	queryset = Product.objects.select_related("category").all().order_by("-created_at")
	serializer_class = ProductSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]


class ProductRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
	queryset = Product.objects.select_related("category").all()
	serializer_class = ProductSerializer
	permission_classes = [IsAuthenticatedOrReadOnly]
	lookup_field = "product_id"
