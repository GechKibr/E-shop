from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import F, Sum

class Cart(models.Model):
    cart_id = models.CharField(primary_key=True, max_length=24, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart"
    )
    products = models.ManyToManyField("products.Product", through="CartItem")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    @classmethod
    def _generate_cart_id(cls):
        prefix = "NIGAT-CART-"
        with transaction.atomic():
            latest_cart = (
                cls.objects.select_for_update()
                .filter(cart_id__startswith=prefix)
                .order_by("-cart_id")
                .first()
            )

            if latest_cart:
                try:
                    next_number = int(latest_cart.cart_id.replace(prefix, "")) + 1
                except ValueError:
                    next_number = 1
            else:
                next_number = 1

            return f"{prefix}{next_number:06d}"

    def save(self, *args, **kwargs):
        if not self.cart_id:
            self.cart_id = self._generate_cart_id()
        super().save(*args, **kwargs)

    @property
    def total_items(self):
        return self.items.aggregate(total=Sum("quantity")).get("total") or 0

    @property
    def total_price(self):
        total = self.items.aggregate(total=Sum(F("quantity") * F("product__price"))).get("total")
        return total if total is not None else Decimal("0.00")

    def get_total_price(self):
        return self.total_price

    @transaction.atomic
    def add_product(self, product, quantity=1):
        if quantity < 1:
            raise ValueError("Quantity must be at least 1.")
        if not product.is_active:
            raise ValueError("Cannot add inactive product to cart.")

        cart_item, created = CartItem.objects.get_or_create(
            cart=self,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            desired_quantity = cart_item.quantity + quantity
            if desired_quantity > product.stock_quantity:
                raise ValueError("Requested quantity exceeds available stock.")
            cart_item.quantity = desired_quantity
            cart_item.save(update_fields=["quantity", "updated_at"])
        elif quantity > product.stock_quantity:
            raise ValueError("Requested quantity exceeds available stock.")

        return cart_item

    def remove_product(self, product):
        self.items.filter(product=product).delete()

    def clear_cart(self):
        self.items.all().delete()

    def __str__(self):
        return f"Cart #{self.cart_id} - {self.user}"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="unique_cart_product"),
        ]
        indexes = [
            models.Index(fields=["cart", "product"]),
        ]
        ordering = ["-added_at"]

    @property
    def subtotal(self):
        return self.product.price * self.quantity

    def get_total_price(self):
        return self.subtotal

    def update_quantity(self, qty):
        if qty > 0:
            self.quantity = qty
            self.save(update_fields=["quantity", "updated_at"])
        else:
            self.delete()

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"


class Wishlist(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products_wishlist"

    def add_product(self, product):
        item, _ = WishlistItem.objects.get_or_create(wishlist=self, product=product)
        return item

    def remove_product(self, product):
        self.items.filter(product=product).delete()

    def get_items(self):
        return self.items.all().select_related("product")

    def __str__(self):
        return f"Wishlist for {self.user.username}"


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "products_wishlistitem"
        unique_together = ("wishlist", "product")
        ordering = ["-added_at"]

    @transaction.atomic
    def move_to_cart(self, cart):
        cart.add_product(self.product, quantity=1)
        self.delete()

    def __str__(self):
        return f"{self.product.name} in {self.wishlist.user.username}'s wishlist"