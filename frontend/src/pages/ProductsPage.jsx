import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import productApi from "../api/productApi";
import { getApiErrorMessage } from "../api/error";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 8;

function ProductsPage() {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [addingId, setAddingId] = useState(null);

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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const inCategory =
        category === "all" || String(product.category?.id) === String(category);
      const inSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query);
      return inCategory && inSearch;
    });
  }, [products, search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleAddToCart = async (productId) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart");
      return;
    }

    setAddingId(productId);
    try {
      await addToCart(productId, 1);
      toast.success("Added to cart");
    } catch (addError) {
      toast.error(getApiErrorMessage(addError, "Failed to add item"));
    } finally {
      setAddingId(null);
    }
  };

  return (
    <section>
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 p-6 text-white">
        <h1 className="text-3xl font-bold">Modern Shopping Experience</h1>
        <p className="mt-2 text-brand-50">
          Search products, filter by category, and shop with a clean responsive flow.
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-[1fr,220px]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-900"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? <LoadingSpinner label="Loading products..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={fetchData} /> : null}

      {!loading && !error && filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          subtitle="Try changing search text or selecting another category."
        />
      ) : null}

      {!loading && !error && filtered.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                adding={addingId === product.product_id}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : null}
    </section>
  );
}

export default ProductsPage;
