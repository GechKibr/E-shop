from django.db import models, transaction
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.text import slugify

class OrderStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, unique=True, blank=True)
    description = models.TextField(blank=True)
    color_hex = models.CharField(max_length=7, default="#808080", help_text="Hex code for frontend UI")
    is_terminal = models.BooleanField(default=False, help_text="If True, order cannot change status further (e.g., Delivered)")

    class Meta:
        verbose_name_plural = "Order Statuses"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Order(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.PROTECT, 
        related_name="orders"
    )
    status = models.ForeignKey(
        OrderStatus, 
        on_delete=models.PROTECT, 
        related_name="orders"
    )
    total_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"

    @transaction.atomic
    def update_status(self, new_status_slug, user=None):
        new_status = OrderStatus.objects.get(slug=new_status_slug)
        if self.status.is_terminal and not user.is_staff:
            raise ValueError("Cannot change status of a completed/canceled order.")
        
        self.status = new_status
        self.save()
        OrderStatusHistory.objects.create(
            order=self,
            status=new_status,
            changed_by=user
        )

    def calculate_total(self):
        total = sum(item.get_total_price() for item in self.items.all())
        self.total_amount = total
        self.save()
        return total


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order, 
        on_delete=models.CASCADE, 
        related_name="items"
    )
    product = models.ForeignKey(
        'products.Product', 
        on_delete=models.SET_NULL, 
        null=True
    )
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    def get_total_price(self):
        return self.quantity * self.price_at_purchase

    def __str__(self):
        return f"{self.quantity} x {self.product.name if self.product else 'Unknown Product'}"


class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    status = models.ForeignKey(OrderStatus, on_delete=models.CASCADE)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    class Meta:
        verbose_name_plural = "Order Status Histories"
        ordering = ['-changed_at']