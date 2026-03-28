from django.urls import path

from .views import (
    CategoryListCreateView,
    CategoryRetrieveUpdateDestroyView,
    ProductListCreateView,
    ProductReviewListCreateView,
    ProductReviewRetrieveUpdateDestroyView,
    ProductRetrieveUpdateDestroyView,
)


urlpatterns = [
    path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
    path("categories/<int:pk>/", CategoryRetrieveUpdateDestroyView.as_view(), name="category-detail"),
    path("products/", ProductListCreateView.as_view(), name="product-list-create"),
    path("products/<str:product_id>/", ProductRetrieveUpdateDestroyView.as_view(), name="product-detail"),
    path("products/<str:product_id>/reviews/", ProductReviewListCreateView.as_view(), name="product-review-list-create"),
    path(
        "products/<str:product_id>/reviews/<int:review_id>/",
        ProductReviewRetrieveUpdateDestroyView.as_view(),
        name="product-review-detail",
    ),
]
