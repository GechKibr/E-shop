import apiClient from "./axiosClient";

const wishlistApi = {
  getWishlist: async () => {
    const { data } = await apiClient.get("/wishlist/");
    return data;
  },
  addItem: async (productId) => {
    const { data } = await apiClient.post("/wishlist/items/", { product_id: productId });
    return data;
  },
  removeItem: async (itemId) => {
    const { data } = await apiClient.delete(`/wishlist/items/${itemId}/`);
    return data;
  },
  moveToCart: async (itemId) => {
    const { data } = await apiClient.patch(`/wishlist/items/${itemId}/move-to-cart/`);
    return data;
  },
  clearWishlist: async () => {
    const { data } = await apiClient.delete("/wishlist/clear/");
    return data;
  },
};

export default wishlistApi;
