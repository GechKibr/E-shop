import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import orderApi from "../../api/orderApi";
import { getApiErrorMessage } from "../../api/error";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import AdminTable from "../components/AdminTable";
import AdminModal from "../components/AdminModal";

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderApi.updateOrder(orderId, { status });
      toast.success("Order status updated");
      fetchOrders();
    } catch (updateError) {
      toast.error(getApiErrorMessage(updateError, "Could not update order status"));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading orders..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOrders} />;
  }

  const columns = [
    { key: "order_id", label: "Order ID" },
    {
      key: "user",
      label: "User",
      render: (row) => row.user || "N/A",
    },
    {
      key: "total_price",
      label: "Total",
      render: (row) => `$${Number(row.total_price || 0).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <select
          defaultValue={row.status || "pending"}
          onChange={(event) => handleStatusUpdate(row.order_id, event.target.value)}
          className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-600"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">Order Management</h2>
      <AdminTable columns={columns} rows={orders} emptyText="No orders found" />

      <AdminModal
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.order_id || ""}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Order Items</p>
          <ul className="space-y-2">
            {selectedOrder?.items?.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
              >
                {item.product_name} x {item.quantity}
              </li>
            ))}
          </ul>
        </div>
      </AdminModal>
    </section>
  );
}

export default AdminOrdersPage;
