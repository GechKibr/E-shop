import { NavLink } from "react-router-dom";

const itemClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;

function AdminSidebar() {
  return (
    <aside className="w-full border-r border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:w-64">
      <h2 className="mb-6 text-lg font-bold">Admin Panel</h2>
      <nav className="space-y-2">
        <NavLink to="/admin" end className={itemClass}>
          <span>📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/products" className={itemClass}>
          <span>📦</span>
          <span>Products</span>
        </NavLink>
        <NavLink to="/admin/categories" className={itemClass}>
          <span>🏷️</span>
          <span>Categories</span>
        </NavLink>
        <NavLink to="/admin/orders" className={itemClass}>
          <span>🧾</span>
          <span>Orders</span>
        </NavLink>
        <NavLink to="/admin/profile" className={itemClass}>
          <span>⚙️</span>
          <span>Profile</span>
        </NavLink>
        <NavLink to="/admin/users" className={itemClass}>
          <span>👥</span>
          <span>Users</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default AdminSidebar;
