import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import productApi from "../../api/productApi";
import { getApiErrorMessage } from "../../api/error";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorState from "../../components/ErrorState";
import AdminTable from "../components/AdminTable";
import AdminModal from "../components/AdminModal";
import ProductForm from "../components/ProductForm";

function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, categoryData] = await Promise.all([
        productApi.getProducts(),
        productApi.getCategories(),
      ]);
      setProducts(Array.isArray(productData) ? productData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load products"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (productId) => {
    try {
      await productApi.deleteProduct(productId);
      toast.success("Product deleted");
      fetchData();
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete product"));
    }
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (selectedProduct) {
        await productApi.updateProduct(selectedProduct.product_id, payload);
        toast.success("Product updated");
      } else {
        await productApi.createProduct(payload);
        toast.success("Product created");
      }
      setModalOpen(false);
      fetchData();
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, "Failed to save product"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading products..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "category",
      label: "Category",
      render: (row) => row.category?.name || "-",
    },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
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
            onClick={() => handleDelete(row.product_id)}
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
        <h2 className="text-2xl font-bold">Product Management</h2>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/categories"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Manage Categories
          </Link>
          <button
            onClick={openCreate}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
          >
            Add Product
          </button>
        </div>
      </div>

      <AdminTable columns={columns} rows={products} emptyText="No products found" />

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedProduct ? "Edit Product" : "Create Product"}
      >
        <ProductForm
          key={selectedProduct?.product_id || "new-product"}
          product={selectedProduct}
          categories={categories}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </AdminModal>
    </section>
  );
}

export default AdminProductsPage;
