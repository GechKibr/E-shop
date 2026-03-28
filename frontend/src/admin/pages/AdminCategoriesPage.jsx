import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import productApi from "../../api/productApi";
import { getApiErrorMessage } from "../../api/error";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import AdminTable from "../components/AdminTable";
import AdminModal from "../components/AdminModal";

const initialForm = {
  name: "",
  description: "",
};

function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await productApi.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditingCategory(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await productApi.deleteCategory(id);
      toast.success("Category deleted");
      fetchCategories();
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete category"));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await productApi.updateCategory(editingCategory.id, form);
        toast.success("Category updated");
      } else {
        await productApi.createCategory(form);
        toast.success("Category created");
      }
      setModalOpen(false);
      setForm(initialForm);
      fetchCategories();
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, "Failed to save category"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading categories..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchCategories} />;
  }

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    {
      key: "description",
      label: "Description",
      render: (row) => row.description || "-",
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(row)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-600"
          >
            Edit
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Category Management</h2>
        <button
          onClick={openCreate}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
        >
          Add Category
        </button>
      </div>

      <AdminTable columns={columns} rows={categories} emptyText="No categories found" />

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Category name"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
            required
          />
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Description"
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            disabled={saving}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
          >
            {saving ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
          </button>
        </form>
      </AdminModal>
    </section>
  );
}

export default AdminCategoriesPage;
