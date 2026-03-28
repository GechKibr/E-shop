import { Link } from "react-router-dom";

function AdminFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p>Admin Dashboard © {year}</p>
        <div className="flex gap-3">
          <Link to="/admin" className="hover:text-brand-600">Dashboard</Link>
          <Link to="/admin/profile" className="hover:text-brand-600">Profile</Link>
          <Link to="/" className="hover:text-brand-600">Storefront</Link>
        </div>
      </div>
    </footer>
  );
}

export default AdminFooter;
