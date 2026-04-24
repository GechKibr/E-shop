import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import productApi from "../api/productApi";
import wishlistApi from "../api/wishlistApi";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../api/error";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("center center");
  const [hoverRating, setHoverRating] = useState(0);

  const currentUserReview = useMemo(
    () => reviews.find((review) => review.user === user?.id),
    [reviews, user]
  );

  useEffect(() => {
    if (!currentUserReview) {
      return;
    }

    setReviewForm({
      rating: Number(currentUserReview.rating || 5),
      comment: currentUserReview.comment || "",
    });
  }, [currentUserReview]);

  const renderStars = (rating) => {
    const value = Number(rating || 0);
    return "★".repeat(value) + "☆".repeat(5 - value);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, reviewData] = await Promise.all([
        productApi.getProductById(productId),
        productApi.getProductReviews(productId),
      ]);
      setProduct(productData);
      setReviews(Array.isArray(reviewData) ? reviewData : []);
      
      // Load wishlist status if authenticated
      if (isAuthenticated) {
        try {
          const wishlistData = await wishlistApi.getWishlist();
          const isInWishlist = wishlistData?.items?.some(item => item.product === (productData?.product_id || productData?.id));
          setIsWishlisted(isInWishlist || false);
        } catch {
          console.log("Could not load wishlist");
        }
      } else {
        setIsWishlisted(false);
      }
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, "Failed to load product"));
    } finally {
      setLoading(false);
    }
  }, [productId, isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (!product?.is_active) {
      toast.error("This product is currently unavailable.");
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.product_id, 1);
      toast.success("Added to cart");
    } catch (addError) {
      toast.error(getApiErrorMessage(addError, "Could not add to cart"));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast.error("Sign in to review this product");
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      };

      if (currentUserReview) {
        await productApi.updateProductReview(productId, currentUserReview.id, payload);
        toast.success("Review updated");
      } else {
        await productApi.createProductReview(productId, payload);
        toast.success("Review added");
      }

      setReviewForm({ rating: 5, comment: "" });
      await loadData();
    } catch (submitError) {
      toast.error(getApiErrorMessage(submitError, "Failed to submit review"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (!product?.is_active) {
      toast.error("This product is currently unavailable.");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        // Find the wishlist item to remove
        const wishlistData = await wishlistApi.getWishlist();
        const itemToRemove = wishlistData?.items?.find(item => item.product === (product?.product_id || product?.id));
        if (itemToRemove) {
          await wishlistApi.removeItem(itemToRemove.id);
          setIsWishlisted(false);
          toast.success("Removed from wishlist");
        }
      } else {
        await wishlistApi.addItem(product?.product_id || product?.id);
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update wishlist"));
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!currentUserReview) {
      return;
    }

    setSubmittingReview(true);
    try {
      await productApi.deleteProductReview(productId, currentUserReview.id);
      toast.success("Review deleted");
      setReviewForm({ rating: 5, comment: "" });
      await loadData();
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, "Failed to delete review"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleImageMove = (event) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - left) / width) * 100;
    const y = ((event.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handleImageLeave = () => {
    setZoomOrigin("center center");
  };

  if (loading) {
    return <LoadingSpinner label="Loading product details..." />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!product) {
    return null;
  }

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(product.price || 0));
  const imageSrc = toAbsoluteMediaUrl(product.product_image_file_url || product.product_image || "");
  const averageRating = Number(product.average_rating || 0);
  const reviewsCount = Number(product.reviews_count || 0);

  return (
    <section className="space-y-6">
      <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2 dark:border-slate-700 dark:bg-slate-900">
        <div
          className="group flex h-72 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 text-7xl dark:from-slate-800 dark:to-slate-900"
          onMouseMove={handleImageMove}
          onMouseLeave={handleImageLeave}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="h-full w-full rounded-xl object-cover transition-transform duration-300 ease-out group-hover:scale-125"
              style={{ transformOrigin: zoomOrigin }}
            />
          ) : (
            "📦"
          )}
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
            {product.category?.name || "General"}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-amber-600 dark:text-amber-400">
            {averageRating > 0 ? `★ ${averageRating.toFixed(1)} / 5` : "No ratings yet"}
            {reviewsCount > 0 ? ` (${reviewsCount} reviews)` : ""}
          </p>
          <p className="mt-4 text-slate-600 dark:text-slate-300">{product.description}</p>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500">Price</p>
              <p className="text-3xl font-extrabold">{price}</p>
            </div>
            <p className="text-sm text-slate-500">Stock: {product.stock}</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleAdd}
              disabled={addingToCart || Number(product.stock) <= 0 || !product.is_active}
              className="rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistLoading || !product.is_active}
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              <span className={`${isWishlisted ? "text-red-500" : ""}`}>
                {isWishlisted ? "❤️ Wishlisted" : "🤍 Add to Wishlist"}
              </span>
            </button>
            <Link
              to="/"
              className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Back to products
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-bold">Customer Reviews</h2>
          <div className="mt-4 space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews yet. Be the first to review.</p>
            ) : (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{review.user_name}</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {renderStars(review.rating)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{review.comment || "-"}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-bold">Write a Review</h2>
          {!isAuthenticated ? (
            <p className="mt-3 text-sm text-slate-500">Please sign in to rate and review this product.</p>
          ) : (
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Rating</label>
                <div
                  className="flex items-center gap-1"
                  onMouseLeave={() => setHoverRating(0)}
                  role="radiogroup"
                  aria-label="Product rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const activeValue = hoverRating || reviewForm.rating;
                    const isFilled = star <= activeValue;

                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={reviewForm.rating === star}
                        aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                        className={`text-2xl transition ${
                          isFilled
                            ? "text-amber-500"
                            : "text-slate-300 hover:text-amber-400 dark:text-slate-600"
                        }`}
                      >
                        ★
                      </button>
                    );
                  })}
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-300">
                    {reviewForm.rating}/5
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Comment</label>
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
                  placeholder="Share your experience with this product"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-60"
                >
                  {submittingReview
                    ? "Saving..."
                    : currentUserReview
                      ? "Update Review"
                      : "Submit Review"}
                </button>
                {currentUserReview ? (
                  <button
                    type="button"
                    onClick={handleReviewDelete}
                    disabled={submittingReview}
                    className="rounded-lg border border-red-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:hover:bg-red-950/30"
                  >
                    Delete Review
                  </button>
                ) : null}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProductDetailPage;
