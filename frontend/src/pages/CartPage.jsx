import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../context/CartContext";
import { getApiErrorMessage } from "../api/error";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

function CartPage() {
  const { cart, loading, updateCartItem, removeCartItem, clearCart, cartTotal } = useCart();

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

  const handleQuantityChange = async (itemId, quantity) => {
    const nextQuantity = Number(quantity);
    if (!nextQuantity || nextQuantity < 1) {
      return;
    }

    try {
      await updateCartItem(itemId, nextQuantity);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update quantity"));
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeCartItem(itemId);
      toast.success("Item removed");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove item"));
    }
  };

  const handleClear = async () => {
    try {
      await clearCart();
      toast.success("Cart cleared");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to clear cart"));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading cart..." />;
  }

  if (!cart?.items?.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        subtitle="Browse products and add items to continue."
      />
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        {cart.items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{item.product_name}</h3>
                <p className="text-sm text-slate-500">Unit price: {formatCurrency(item.price)}</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                  className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-800"
                />
                <span className="w-24 text-right text-sm font-semibold">
                  {formatCurrency(item.subtotal)}
                </span>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex justify-between">
            <span>Total items</span>
            <span>{cart.total_items}</span>
          </p>
          <p className="flex justify-between text-base font-bold">
            <span>Total price</span>
            <span>{formatCurrency(cartTotal)}</span>
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            to="/checkout"
            className="block rounded-lg bg-brand-600 px-4 py-2 text-center font-semibold text-white hover:bg-brand-500"
          >
            Proceed to checkout
          </Link>
          <button
            onClick={handleClear}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Clear cart
          </button>
        </div>
      </aside>
    </section>
  );
}

export default CartPage;
