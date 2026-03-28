import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import DarkModeToggle from "./DarkModeToggle";

const navItemClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/");
  };

  const customerLinks = (
    <>
      <NavLink to="/orders" className={navItemClass}>
        Orders
      </NavLink>
      <NavLink to="/wishlist" className={navItemClass}>
        Wishlist
      </NavLink>
      <NavLink to="/cart" className={navItemClass}>
        🛒 Cart ({cartCount})
      </NavLink>
      <NavLink to="/profile" className={navItemClass}>
        Profile
      </NavLink>
    </>
  );

  const adminLinks = (
    <>
      <NavLink to="/admin" className={navItemClass}>
        Admin Panel
      </NavLink>
      <NavLink to="/admin/orders" className={navItemClass}>
        Manage Orders
      </NavLink>
      <NavLink to="/admin/profile" className={navItemClass}>
        Admin Profile
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-700 dark:bg-slate-950/90">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          E-Shop
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" className={navItemClass} end>
            Products
          </NavLink>
          {isAuthenticated ? (isAdmin ? adminLinks : customerLinks) : null}
        </div>

        <div className="flex items-center gap-2">
          <DarkModeToggle />
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
                {user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
