from django.db import models
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    product_id = models.CharField(primary_key=True, max_length=20, editable=False)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def _generate_product_id(cls):
        date_str = timezone.localdate().strftime("%Y%m%d")
        prefix = f"NIGAT{date_str}"

        latest_product = cls.objects.filter(product_id__startswith=prefix).order_by("-product_id").first()

        if latest_product:
            next_sequence = int(latest_product.product_id[-6:]) + 1
        else:
            next_sequence = 1

        return f"{prefix}{next_sequence:06d}"

    def save(self, *args, **kwargs):
        if not self.product_id:
            self.product_id = self._generate_product_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

