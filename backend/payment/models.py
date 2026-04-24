from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"
    FAILED = "FAILED", "Failed"


class Payment(models.Model):
    """
    Payment model to track Chapa payment transactions.
    """
    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="payment"
    )
    tx_ref = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Unique transaction reference from Chapa"
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    chapa_response = models.JSONField(
        null=True,
        blank=True,
        help_text="Raw response from Chapa API"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tx_ref"]),
            models.Index(fields=["status"]),
            models.Index(fields=["order"]),
        ]

    def __str__(self):
        return f"Payment {self.tx_ref} - {self.status}"
