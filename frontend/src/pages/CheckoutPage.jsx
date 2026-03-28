import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import orderApi from "../api/orderApi";
import { getApiErrorMessage } from "../api/error";
import { useCart } from "../context/CartContext";
import EmptyState from "../components/EmptyState";

function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, cartTotal, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);

  if (!cart?.items?.length) {
    return (
      <EmptyState
        title="Nothing to checkout"
        subtitle="Your cart is empty. Add products to continue."
      />
    );
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const payload = {
        items: cart.items.map((item) => ({
          product_id: item.product,
          quantity: item.quantity,
        })),
      };
      await orderApi.createOrder(payload);
      await refreshCart();
      toast.success("Order placed successfully");
      navigate("/orders");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to place order"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Review your products before placing your order.
        </p>

        <div className="mt-6 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/70">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Payment Summary</h2>
        <p className="mt-3 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300">Total</span>
          <span className="text-2xl font-extrabold">{formatCurrency(cartTotal)}</span>
        </p>

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
        >
          {loading ? "Placing order..." : "Place order"}
        </button>

        <Link
          to="/cart"
          className="mt-2 block text-center text-sm font-medium text-brand-600 hover:underline"
        >
          Back to cart
        </Link>
      </aside>
    </section>
  );
}

export default CheckoutPage;
