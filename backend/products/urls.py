from django.urls import path

from .views import (
    CategoryListCreateView,
    CategoryRetrieveUpdateDestroyView,
    ProductImageListCreateView,
    ProductImageRetrieveUpdateDestroyView,
    ProductImageSetPrimaryView,
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
    path("products/<str:product_id>/images/", ProductImageListCreateView.as_view(), name="product-image-list-create"),
    path(
        "products/<str:product_id>/images/<int:image_id>/",
        ProductImageRetrieveUpdateDestroyView.as_view(),
        name="product-image-detail",
    ),
    path(
        "products/<str:product_id>/images/<int:image_id>/set-primary/",
        ProductImageSetPrimaryView.as_view(),
        name="product-image-set-primary",
    ),
    path("products/<str:product_id>/reviews/", ProductReviewListCreateView.as_view(), name="product-review-list-create"),
    path(
        "products/<str:product_id>/reviews/<int:review_id>/",
        ProductReviewRetrieveUpdateDestroyView.as_view(),
        name="product-review-detail",
    ),
]
