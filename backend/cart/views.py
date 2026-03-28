from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics

from .models import Cart, CartItem, Wishlist, WishlistItem
from .serializers import (
	AddCartItemSerializer,
	CartItemSerializer,
	CartSerializer,
	UpdateCartItemSerializer,
	WishlistAddItemSerializer,
	WishlistSerializer,
)


def get_or_create_user_cart(user):
	return Cart.objects.get_or_create(user=user)


def get_optimized_cart(user):
	return (
		Cart.objects.select_related("user")
		.prefetch_related("items__product__images")
		.get(user=user)
	)

class CartView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		cart, _ = get_or_create_user_cart(request.user)
		cart = get_optimized_cart(request.user)
		serializer = CartSerializer(cart)
		return Response(serializer.data, status=status.HTTP_200_OK)


class AddCartItemView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		serializer = AddCartItemSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		cart, _ = get_or_create_user_cart(request.user)
		product = serializer.validated_data["product"]
		quantity = serializer.validated_data["requested_quantity"]

		existing_item = CartItem.objects.filter(cart=cart, product=product).first()
		desired_quantity = quantity + (existing_item.quantity if existing_item else 0)
		if desired_quantity > product.stock_quantity:
			return Response(
				{"detail": "Requested quantity exceeds available stock."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		item, created = CartItem.objects.get_or_create(
			cart=cart,
			product=product,
			defaults={"quantity": quantity},
		)
		if not created:
			item.quantity += quantity
			item.save(update_fields=["quantity", "updated_at"])

		cart = get_optimized_cart(request.user)
		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_201_CREATED)


class CartItemDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, item_id):
		cart, _ = get_or_create_user_cart(request.user)
		item = get_object_or_404(
			CartItem.objects.select_related("product").prefetch_related("product__images"),
			id=item_id,
			cart=cart,
		)
		serializer = CartItemSerializer(item)
		return Response(serializer.data, status=status.HTTP_200_OK)


class UpdateCartItemQuantityView(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request, item_id):
		serializer = UpdateCartItemSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		cart = get_object_or_404(Cart.objects.select_related("user"), user=request.user)
		item = get_object_or_404(CartItem, id=item_id, cart=cart)
		if not item.product.is_active:
			raise ValidationError({"detail": "Cannot update quantity for an inactive product."})

		requested_quantity = serializer.validated_data["quantity"]
		if requested_quantity > item.product.stock_quantity:
			return Response(
				{"detail": "Requested quantity exceeds available stock."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		item.quantity = requested_quantity
		item.save(update_fields=["quantity", "updated_at"])

		cart = get_optimized_cart(request.user)
		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_200_OK)


class RemoveCartItemView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, item_id):
		cart = get_object_or_404(Cart, user=request.user)
		item = get_object_or_404(CartItem, id=item_id, cart=cart)
		item.delete()

		cart = get_optimized_cart(request.user)
		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_200_OK)


class ClearCartView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request):
		cart = get_object_or_404(Cart, user=request.user)
		cart.items.all().delete()
		cart = get_optimized_cart(request.user)
		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_200_OK)


def get_or_create_user_wishlist(user):
	return Wishlist.objects.get_or_create(user=user)


def get_user_wishlist(user):
	return Wishlist.objects.prefetch_related("items__product__images").get(user=user)


class WishlistDetailView(generics.RetrieveAPIView):
	serializer_class = WishlistSerializer
	permission_classes = [IsAuthenticated]

	def get_object(self):
		get_or_create_user_wishlist(self.request.user)
		return get_user_wishlist(self.request.user)


class WishlistAddItemView(generics.CreateAPIView):
	serializer_class = WishlistAddItemSerializer
	permission_classes = [IsAuthenticated]

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		wishlist, _ = get_or_create_user_wishlist(request.user)
		product = serializer.context["product"]
		wishlist.add_product(product)

		response_serializer = WishlistSerializer(get_user_wishlist(request.user))
		return Response(response_serializer.data, status=201)


class WishlistRemoveItemView(generics.DestroyAPIView):
	permission_classes = [IsAuthenticated]
	lookup_url_kwarg = "item_id"

	def get_queryset(self):
		wishlist, _ = get_or_create_user_wishlist(self.request.user)
		return WishlistItem.objects.filter(wishlist=wishlist).select_related("product")

	def destroy(self, request, *args, **kwargs):
		instance = self.get_object()
		instance.delete()
		response_serializer = WishlistSerializer(get_user_wishlist(request.user))
		return Response(response_serializer.data, status=200)


class WishlistClearView(generics.DestroyAPIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, *args, **kwargs):
		wishlist, _ = get_or_create_user_wishlist(request.user)
		wishlist.items.all().delete()
		response_serializer = WishlistSerializer(get_user_wishlist(request.user))
		return Response(response_serializer.data, status=200)


class WishlistMoveToCartView(generics.UpdateAPIView):
	permission_classes = [IsAuthenticated]
	http_method_names = ["patch"]
	lookup_url_kwarg = "item_id"

	def get_queryset(self):
		wishlist, _ = get_or_create_user_wishlist(self.request.user)
		return WishlistItem.objects.filter(wishlist=wishlist).select_related("product")

	def patch(self, request, *args, **kwargs):
		wishlist_item = self.get_object()
		cart, _ = Cart.objects.get_or_create(user=request.user)

		try:
			wishlist_item.move_to_cart(cart)
		except ValueError as exc:
			raise ValidationError({"detail": str(exc)}) from exc

		response_serializer = WishlistSerializer(get_user_wishlist(request.user))
		return Response(response_serializer.data, status=200)
