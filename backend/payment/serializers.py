"""
Payment Serializers for REST API
"""
from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "tx_ref",
            "amount",
            "status",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "tx_ref", "created_at", "updated_at"]


class PaymentInitiateSerializer(serializers.Serializer):
    """Serializer for payment initiation request"""
    
    return_url = serializers.URLField(required=False, allow_blank=True)
    
    def validate_return_url(self, value):
        """Validate return URL"""
        if value and not value.startswith(("http://", "https://")):
            raise serializers.ValidationError("Return URL must be a valid HTTP(S) URL")
        return value


class PaymentCallbackSerializer(serializers.Serializer):
    """Serializer for Chapa webhook callback"""
    
    tx_ref = serializers.CharField(required=True, max_length=255)
    status = serializers.CharField(required=False, max_length=50)
    
    def validate_tx_ref(self, value):
        """Validate transaction reference exists"""
        if not Payment.objects.filter(tx_ref=value).exists():
            raise serializers.ValidationError(f"Payment with tx_ref '{value}' not found")
        return value


class PaymentStatusSerializer(serializers.Serializer):
    """Serializer for payment status response"""
    
    payment_id = serializers.IntegerField(read_only=True)
    tx_ref = serializers.CharField(read_only=True)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    status = serializers.CharField(read_only=True)
    order_id = serializers.IntegerField(read_only=True)
    message = serializers.CharField(read_only=True)


class ChapaCheckoutResponseSerializer(serializers.Serializer):
    """Serializer for Chapa checkout initialization response"""
    
    checkout_url = serializers.URLField(read_only=True)
    tx_ref = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    payment_id = serializers.IntegerField(read_only=True)
