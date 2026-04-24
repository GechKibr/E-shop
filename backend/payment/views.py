"""
Payment API Views
Handles payment initiation, verification, and webhook callbacks
"""
import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.views.decorators.http import require_http_methods

from orders.models import Order, PaymentStatus as OrderPaymentStatus
from .models import Payment, PaymentStatus
from .serializers import (
    PaymentSerializer,
    PaymentInitiateSerializer,
    PaymentCallbackSerializer,
    PaymentStatusSerializer,
    ChapaCheckoutResponseSerializer,
)
from .chapa_service import get_chapa_service, ChapaException

logger = logging.getLogger(__name__)


class PaymentInitiateView(generics.CreateAPIView):
    """
    Endpoint to initiate payment for an order
    POST /api/payments/initiate/{order_id}/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentInitiateSerializer
    
    def create(self, request, order_id, *args, **kwargs):
        """Initiate Chapa payment"""
        try:
            # Get the order
            order = get_object_or_404(Order, id=order_id, user=request.user)
            
            # Check if order is already paid
            if order.payment_status != OrderPaymentStatus.UNPAID:
                return Response(
                    {
                        "error": f"Order payment status is {order.payment_status}. Cannot initiate payment.",
                        "current_status": order.payment_status
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if order has amount
            if order.total_amount <= 0:
                return Response(
                    {"error": "Order total amount must be greater than 0"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate serializer for additional parameters
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            return_url = serializer.validated_data.get("return_url", "")
            
            # Initialize Chapa payment
            chapa = get_chapa_service()
            
            success, checkout_url, chapa_response = chapa.initialize_payment(
                amount=order.total_amount,
                email=request.user.email,
                order_id=order.id,
                customer_name=request.user.get_full_name() or request.user.username,
                return_url=return_url
            )
            
            if not success:
                logger.error(f"Failed to initialize payment for order {order_id}: {chapa_response}")
                return Response(
                    {"error": "Failed to initialize payment", "details": chapa_response},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not checkout_url:
                logger.error(f"No checkout URL returned for order {order_id}")
                return Response(
                    {"error": "Failed to get checkout URL from payment gateway"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create or update payment record
            tx_ref = chapa_response.get("tx_ref")
            with transaction.atomic():
                payment, created = Payment.objects.get_or_create(
                    order=order,
                    defaults={
                        "tx_ref": tx_ref,
                        "amount": order.total_amount,
                        "status": PaymentStatus.PENDING,
                        "chapa_response": chapa_response
                    }
                )
                
                # Update order payment status to pending
                order.payment_status = OrderPaymentStatus.PENDING
                order.save(update_fields=["payment_status"])
                
                logger.info(f"Payment initiated for order {order_id}: tx_ref={tx_ref}")
            
            # Return response
            response_data = {
                "checkout_url": checkout_url,
                "tx_ref": tx_ref,
                "payment_id": payment.id,
                "message": "Payment initialized successfully. Redirecting to Chapa..."
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        except ChapaException as e:
            logger.error(f"Chapa service error: {str(e)}")
            return Response(
                {"error": f"Payment service error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.exception(f"Unexpected error initiating payment for order {order_id}")
            return Response(
                {"error": "An unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_webhook(request):
    """
    Webhook endpoint to receive payment status from Chapa
    POST /api/payments/webhook/
    
    Expected payload from Chapa:
    {
        "tx_ref": "chapa-xxx",
        "status": "success" | "failed"
    }
    """
    try:
        logger.info(f"Received webhook from Chapa: {request.data}")
        
        # Validate webhook data
        serializer = PaymentCallbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tx_ref = serializer.validated_data.get("tx_ref")
        
        # Get payment record
        payment = get_object_or_404(Payment, tx_ref=tx_ref)
        
        # Verify payment with Chapa (do NOT trust webhook blindly)
        chapa = get_chapa_service()
        success, verification_response = chapa.verify_payment(tx_ref)
        
        if not success:
            logger.warning(f"Failed to verify payment {tx_ref} with Chapa")
            return Response(
                {"error": "Failed to verify payment with Chapa"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_data = verification_response.get("data", {})
        chapa_status = payment_data.get("status")
        
        logger.info(f"Chapa verification for {tx_ref}: status={chapa_status}")
        
        # Update payment and order based on Chapa verification
        with transaction.atomic():
            order = payment.order
            
            if chapa_status == "success":
                # Payment successful
                payment.status = PaymentStatus.COMPLETED
                payment.chapa_response = verification_response
                payment.save()
                
                order.payment_status = OrderPaymentStatus.COMPLETED
                order.save(update_fields=["payment_status"])
                
                logger.info(f"Payment completed for order {order.id}: {tx_ref}")
                
                return Response(
                    {
                        "status": "success",
                        "message": "Payment verified and order updated",
                        "order_id": order.id,
                        "tx_ref": tx_ref
                    },
                    status=status.HTTP_200_OK
                )
            else:
                # Payment failed
                payment.status = PaymentStatus.FAILED
                payment.chapa_response = verification_response
                payment.save()
                
                order.payment_status = OrderPaymentStatus.UNPAID
                order.save(update_fields=["payment_status"])
                
                logger.warning(f"Payment failed for order {order.id}: {tx_ref}")
                
                return Response(
                    {
                        "status": "failed",
                        "message": f"Payment verification failed: {chapa_status}",
                        "order_id": order.id
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
    
    except Exception as e:
        logger.exception("Error processing webhook")
        return Response(
            {"error": "Error processing webhook"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class PaymentStatusView(generics.RetrieveAPIView):
    """
    Get payment status for an order
    GET /api/payments/order/{order_id}/status/
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentStatusSerializer
    
    def retrieve(self, request, order_id, *args, **kwargs):
        """Get payment status"""
        try:
            # Get order
            order = get_object_or_404(Order, id=order_id, user=request.user)
            
            # Get payment if exists
            try:
                payment = Payment.objects.get(order=order)
            except Payment.DoesNotExist:
                return Response(
                    {
                        "order_id": order.id,
                        "status": order.payment_status,
                        "message": "No payment record found for this order"
                    },
                    status=status.HTTP_200_OK
                )
            
            # Return payment status
            response_data = {
                "payment_id": payment.id,
                "order_id": order.id,
                "tx_ref": payment.tx_ref,
                "amount": payment.amount,
                "status": payment.status,
                "message": f"Payment status: {payment.status}"
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.exception(f"Error getting payment status for order {order_id}")
            return Response(
                {"error": "Error retrieving payment status"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
