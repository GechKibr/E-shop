from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class OrderListCreateView(generics.ListCreateAPIView):
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		queryset = Order.objects.prefetch_related("items__product")
		if self.request.user.is_staff:
			return queryset
		return queryset.filter(user=self.request.user)

	def get_serializer_class(self):
		if self.request.method == "POST":
			return OrderCreateSerializer
		return OrderSerializer

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		order = serializer.save()
		response_serializer = OrderSerializer(order)
		return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class OrderRetrieveView(generics.RetrieveAPIView):
	serializer_class = OrderSerializer
	permission_classes = [IsAuthenticated]
	lookup_field = "order_id"

	def get_queryset(self):
		queryset = Order.objects.prefetch_related("items__product")
		if self.request.user.is_staff:
			return queryset
		return queryset.filter(user=self.request.user)

	def get_object(self):
		queryset = self.get_queryset()
		return get_object_or_404(queryset, order_id=self.kwargs["order_id"])
