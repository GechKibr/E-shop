from django.db import models, transaction
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='children'
    )
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_children(self):
        return self.children.all()

    def get_full_path(self):
        full_path = [self.name]
        k = self.parent
        while k is not None:
            full_path.append(k.name)
            k = k.parent
        return " > ".join(full_path[::-1])

    def __str__(self):
        return self.get_full_path()


class Product(models.Model):
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='products'
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0.01)]
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def is_in_stock(self):
        return self.stock_quantity > 0

    @transaction.atomic
    def reduce_stock(self, quantity):
        if quantity <= self.stock_quantity:
            self.stock_quantity -= quantity
            self.save()
            return True
        return False

    def increase_stock(self, quantity):
        self.stock_quantity += quantity
        self.save()

    def get_primary_image(self):
        primary = self.images.filter(is_primary=True).first()
        return primary.image_url if primary else None

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image_url = models.URLField()
    is_primary = models.BooleanField(default=False)

    def set_as_primary(self):
        with transaction.atomic():
            ProductImage.objects.filter(product=self.product).update(is_primary=False)
            self.is_primary = True
            self.save()

    def save(self, *args, **kwargs):
        if not ProductImage.objects.filter(product=self.product).exists():
            self.is_primary = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Image for {self.product.name}"



class ProductReview(models.Model):
    product = models.ForeignKey(
        Product, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    user = models.ForeignKey(
        'accounts.User', 
        on_delete=models.CASCADE, 
        related_name='product_reviews'
    )
    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.username} for {self.product.name}"