import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function AdminTopbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Admin Console</p>
        <h1 className="text-xl font-bold">E-commerce Dashboard</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold">{user?.username}</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
        <Link
          to="/admin/profile"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default AdminTopbar;
