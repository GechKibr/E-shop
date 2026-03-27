from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from products.models import Product
from .models import Cart, CartItem
from .serializers import AddCartItemSerializer, CartSerializer, UpdateCartItemSerializer

class CartView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		cart, _ = Cart.objects.get_or_create(user=request.user)
		serializer = CartSerializer(cart)
		return Response(serializer.data, status=status.HTTP_200_OK)


class AddCartItemView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		serializer = AddCartItemSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		cart, _ = Cart.objects.get_or_create(user=request.user)
		product = get_object_or_404(Product, pk=serializer.validated_data["product_id"])
		quantity = serializer.validated_data["quantity"]

		existing_item = CartItem.objects.filter(cart=cart, product=product).first()
		desired_quantity = quantity + (existing_item.quantity if existing_item else 0)
		if desired_quantity > product.stock:
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

		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_201_CREATED)


class UpdateCartItemQuantityView(APIView):
	permission_classes = [IsAuthenticated]

	def patch(self, request, item_id):
		serializer = UpdateCartItemSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		cart = get_object_or_404(Cart, user=request.user)
		item = get_object_or_404(CartItem, id=item_id, cart=cart)
		requested_quantity = serializer.validated_data["quantity"]
		if requested_quantity > item.product.stock:
			return Response(
				{"detail": "Requested quantity exceeds available stock."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		item.quantity = requested_quantity
		item.save(update_fields=["quantity", "updated_at"])

		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_200_OK)


class RemoveCartItemView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, item_id):
		cart = get_object_or_404(Cart, user=request.user)
		item = get_object_or_404(CartItem, id=item_id, cart=cart)
		item.delete()

		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_200_OK)


class ClearCartView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request):
		cart = get_object_or_404(Cart, user=request.user)
		cart.items.all().delete()
		cart_serializer = CartSerializer(cart)
		return Response(cart_serializer.data, status=status.HTTP_200_OK)
