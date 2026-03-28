import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import wishlistApi from "../api/wishlistApi";
import { getApiErrorMessage } from "../api/error";
import { useCart } from "../context/CartContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

function WishlistPage() {
  const { refreshCart } = useCart();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingItemId, setProcessingItemId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const loadWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const data = await wishlistApi.getWishlist();
      setWishlist(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load wishlist"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));

  const items = useMemo(() => (Array.isArray(wishlist?.items) ? wishlist.items : []), [wishlist]);

  const handleRemove = async (itemId) => {
    setProcessingItemId(itemId);
    try {
      const data = await wishlistApi.removeItem(itemId);
      setWishlist(data);
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove item"));
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleMoveToCart = async (itemId) => {
    setProcessingItemId(itemId);
    try {
      const data = await wishlistApi.moveToCart(itemId);
      setWishlist(data);
      await refreshCart();
      toast.success("Moved to cart");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to move item to cart"));
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      const data = await wishlistApi.clearWishlist();
      setWishlist(data);
      toast.success("Wishlist cleared");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to clear wishlist"));
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading wishlist..." />;
  }

  if (!items.length) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        subtitle="Save products you love and come back to them anytime."
      />
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{item.product_name}</h3>
                <p className="text-sm text-slate-500">Price: {formatCurrency(item.product_price)}</p>
                <p className="mt-1 text-xs text-slate-500">{item.in_stock ? "In stock" : "Out of stock"}</p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/products/${item.product_id}`}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                >
                  View
                </Link>
                <button
                  onClick={() => handleMoveToCart(item.id)}
                  disabled={processingItemId === item.id || !item.in_stock}
                  className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Move to cart
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={processingItemId === item.id}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:hover:bg-red-950/40"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Wishlist Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex justify-between">
            <span>Saved items</span>
            <span>{items.length}</span>
          </p>
          <p className="flex justify-between">
            <span>Available now</span>
            <span>{items.filter((item) => item.in_stock).length}</span>
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleClear}
            disabled={clearing}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {clearing ? "Clearing..." : "Clear wishlist"}
          </button>
          <Link
            to="/"
            className="block rounded-lg bg-brand-600 px-4 py-2 text-center font-semibold text-white hover:bg-brand-500"
          >
            Continue shopping
          </Link>
        </div>
      </aside>
    </section>
  );
}

export default WishlistPage;
