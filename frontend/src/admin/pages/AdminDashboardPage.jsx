import { useEffect, useState } from "react";
import adminApi from "../../api/adminApi";
import { getApiErrorMessage } from "../../api/error";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import StatCard from "../components/StatCard";

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load dashboard stats"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading admin dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchStats} />;
  }

  const revenue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(stats?.total_revenue || 0));

  return (
    <section>
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Live business metrics from your e-commerce backend.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={stats?.total_users ?? 0} accent="brand" />
        <StatCard title="Total Products" value={stats?.total_products ?? 0} accent="emerald" />
        <StatCard title="Total Orders" value={stats?.total_orders ?? 0} accent="violet" />
        <StatCard title="Total Revenue" value={revenue} accent="amber" />
      </div>
    </section>
  );
}

export default AdminDashboardPage;
