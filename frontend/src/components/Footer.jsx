import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Footer() {
  const { isAuthenticated, isAdmin } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-slate-300">
        <p>E-Shop © {year}. All rights reserved.</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/" className="hover:text-brand-600">Home</Link>
          {isAuthenticated && !isAdmin ? <Link to="/orders" className="hover:text-brand-600">My Orders</Link> : null}
          {isAuthenticated ? <Link to="/profile" className="hover:text-brand-600">Profile</Link> : null}
          {isAuthenticated && isAdmin ? <Link to="/admin" className="hover:text-brand-600">Admin Panel</Link> : null}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
