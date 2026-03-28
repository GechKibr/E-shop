from django.urls import path

from .views import (
    AddCartItemView,
    CartItemDetailView,
    CartView,
    ClearCartView,
    RemoveCartItemView,
    UpdateCartItemQuantityView,
    WishlistAddItemView,
    WishlistClearView,
    WishlistDetailView,
    WishlistMoveToCartView,
    WishlistRemoveItemView,
)


urlpatterns = [
    path("cart/", CartView.as_view(), name="cart-detail"),
    path("cart/items/", AddCartItemView.as_view(), name="cart-item-add"),
    path("cart/items/<int:item_id>/detail/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("cart/items/<int:item_id>/", UpdateCartItemQuantityView.as_view(), name="cart-item-update"),
    path("cart/items/<int:item_id>/remove/", RemoveCartItemView.as_view(), name="cart-item-remove"),
    path("cart/clear/", ClearCartView.as_view(), name="cart-clear"),
    path("wishlist/", WishlistDetailView.as_view(), name="wishlist-detail"),
    path("wishlist/items/", WishlistAddItemView.as_view(), name="wishlist-item-add"),
    path("wishlist/items/<int:item_id>/", WishlistRemoveItemView.as_view(), name="wishlist-item-remove"),
    path("wishlist/items/<int:item_id>/move-to-cart/", WishlistMoveToCartView.as_view(), name="wishlist-item-move-to-cart"),
    path("wishlist/clear/", WishlistClearView.as_view(), name="wishlist-clear"),
]
