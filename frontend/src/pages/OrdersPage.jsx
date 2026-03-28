import { useEffect, useState } from "react";
import orderApi from "../api/orderApi";
import { getApiErrorMessage } from "../api/error";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await orderApi.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

  if (loading) {
    return <LoadingSpinner label="Loading orders..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOrders} />;
  }

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        subtitle="Your placed orders will appear here."
      />
    );
  }

  return (
    <section>
      <h1 className="text-2xl font-bold">My Orders</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Track your previous purchases and totals.
      </p>

      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article
            key={order.order_id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Order #{order.order_id}</h2>
              <span className="text-sm font-semibold text-brand-600">
                {formatCurrency(order.total_price)}
              </span>
            </div>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.product_name} x {item.quantity}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export default OrdersPage;
