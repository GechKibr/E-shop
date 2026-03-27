from django.urls import path

from .views import AddCartItemView, CartView, ClearCartView, RemoveCartItemView, UpdateCartItemQuantityView


urlpatterns = [
    path("cart/", CartView.as_view(), name="cart-detail"),
    path("cart/items/", AddCartItemView.as_view(), name="cart-item-add"),
    path("cart/items/<int:item_id>/", UpdateCartItemQuantityView.as_view(), name="cart-item-update"),
    path("cart/items/<int:item_id>/remove/", RemoveCartItemView.as_view(), name="cart-item-remove"),
    path("cart/clear/", ClearCartView.as_view(), name="cart-clear"),
]
