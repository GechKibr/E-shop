import { Link } from "react-router-dom";

function ProductCard({ product, onAddToCart, adding, onWishlistToggle, isWishlisted, wishlistLoading }) {
  const imageSrc = product.product_image_file_url || product.product_image || "";
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(product.price || 0));
  const averageRating = Number(product.average_rating || 0);
  const reviewsCount = Number(product.reviews_count || 0);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-5xl dark:from-slate-800 dark:to-slate-900">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full rounded-xl object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          "🛍️"
        )}
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
        {product.category?.name || "General"}
      </p>
      <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{product.name}</h3>
      <p className="mt-2 min-h-10 text-sm text-slate-600 dark:text-slate-300">
        {product.description || "Premium quality product for everyday needs."}
      </p>

      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
        {averageRating > 0 ? `★ ${averageRating.toFixed(1)}` : "No ratings yet"}
        {reviewsCount > 0 ? ` (${reviewsCount} reviews)` : ""}
      </p>

      <div className="mt-auto pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xl font-bold text-slate-900 dark:text-white">{price}</span>
          <button
            onClick={() => onWishlistToggle(product.product_id)}
            disabled={wishlistLoading || !product.is_active}
            className="transition"
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <span className={`text-2xl ${isWishlisted ? "text-red-500" : "text-slate-300 hover:text-red-500 dark:text-slate-600"}`}>
              {isWishlisted ? "❤️" : "🤍"}
            </span>
          </button>
        </div>

        <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          {product.stock} in stock
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/products/${product.product_id}`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Details
          </Link>
          <button
            onClick={() => onAddToCart(product.product_id)}
            disabled={adding || Number(product.stock) <= 0 || !product.is_active}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
