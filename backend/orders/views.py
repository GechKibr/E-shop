from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Order, OrderStatus
from .serializers import OrderCreateSerializer, OrderSerializer, OrderStatusSerializer, OrderStatusUpdateSerializer


class OrderListCreateView(generics.ListCreateAPIView):
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		queryset = Order.objects.select_related("status", "user").prefetch_related("items__product", "status_history__status", "status_history__changed_by")
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
	lookup_field = "id"
	lookup_url_kwarg = "order_id"

	def get_queryset(self):
		queryset = Order.objects.select_related("status", "user").prefetch_related("items__product", "status_history__status", "status_history__changed_by")
		if self.request.user.is_staff:
			return queryset
		return queryset.filter(user=self.request.user)

	def get_object(self):
		queryset = self.get_queryset()
		return get_object_or_404(queryset, id=self.kwargs["order_id"])


class OrderStatusListView(generics.ListAPIView):
	queryset = OrderStatus.objects.all().order_by("name")
	serializer_class = OrderStatusSerializer
	permission_classes = [IsAuthenticated]


class OrderStatusUpdateView(generics.UpdateAPIView):
	serializer_class = OrderStatusUpdateSerializer
	permission_classes = [IsAdminUser]
	http_method_names = ["patch"]
	lookup_field = "id"
	lookup_url_kwarg = "order_id"
	queryset = Order.objects.select_related("status", "user").all()
