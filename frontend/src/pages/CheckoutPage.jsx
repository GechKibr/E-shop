import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import orderApi from "../api/orderApi";
import paymentApi from "../api/paymentApi";
import { getApiErrorMessage } from "../api/error";
import { useCart } from "../context/CartContext";
import EmptyState from "../components/EmptyState";

function CheckoutPage() {
  const { cart, cartTotal } = useCart();
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
      // Step 1: Create the order
      const payload = {
        items: cart.items.map((item) => ({
          product_id: item.product,
          quantity: item.quantity,
        })),
      };
      
      const orderResponse = await orderApi.createOrder(payload);
      const newOrderId = orderResponse.order_id;
      sessionStorage.setItem("last_order_id", String(newOrderId));
      
      // Step 2: Initiate payment
      const returnUrl = `${window.location.origin}/payment/callback`;
      const paymentResponse = await paymentApi.initiatePayment(newOrderId, returnUrl);
      
      if (paymentResponse.checkout_url) {
        // Step 3: Redirect to Chapa checkout page
        toast.success("Redirecting to payment gateway...");
        setTimeout(() => {
          window.location.href = paymentResponse.checkout_url;
        }, 500);
      } else {
        toast.error("Failed to get checkout URL from payment gateway");
        setLoading(false);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to process order and payment"));
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
          {loading ? "Processing..." : "Pay Now"}
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
