import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

function AdminProfilePage() {
  const { user, updateProfile, getApiErrorMessage } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
    });
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success("Admin profile updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update admin profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-2xl font-bold">Admin Profile</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Manage your administrator account details.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <input
          placeholder="Username"
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          required
        />
        <input
          placeholder="First name"
          value={form.first_name}
          onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        />
        <input
          placeholder="Last name"
          value={form.last_name}
          onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        />

        <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800">
          Role: <span className="font-semibold">{user?.role || "Admin"}</span>
        </div>

        <button
          disabled={saving}
          className="md:col-span-2 rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Admin Profile"}
        </button>
      </form>
    </section>
  );
}

export default AdminProfilePage;
