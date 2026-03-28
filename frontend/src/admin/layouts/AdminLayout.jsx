import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminTopbar from "../components/AdminTopbar";
import AdminFooter from "../components/AdminFooter";

function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
          <AdminFooter />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
