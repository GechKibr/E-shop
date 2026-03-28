import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import userApi from "../../api/userApi";
import { getApiErrorMessage } from "../../api/error";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import AdminTable from "../components/AdminTable";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userApi.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await userApi.deleteUser(id);
      toast.success("User deleted");
      fetchUsers();
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete user"));
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === "Admin" ? "Customer" : "Admin";
    try {
      await userApi.updateUserRole(user.id, nextRole);
      toast.success(`Role changed to ${nextRole}`);
      fetchUsers();
    } catch (roleError) {
      toast.error(getApiErrorMessage(roleError, "Failed to update role"));
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading users..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchUsers} />;
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleToggleRole(row)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-600"
          >
            Toggle Admin
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 dark:border-red-900"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">User Management</h2>
      <AdminTable columns={columns} rows={users} emptyText="No users found" />
    </section>
  );
}

export default AdminUsersPage;
