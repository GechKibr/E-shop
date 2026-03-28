import apiClient from "./axiosClient";

const cartApi = {
  getCart: async () => {
    const { data } = await apiClient.get("/cart/");
    return data;
  },
  addItem: async ({ product_id, quantity }) => {
    const { data } = await apiClient.post("/cart/items/", { product_id, quantity });
    return data;
  },
  updateItem: async (itemId, quantity) => {
    const { data } = await apiClient.patch(`/cart/items/${itemId}/`, { quantity });
    return data;
  },
  removeItem: async (itemId) => {
    const { data } = await apiClient.delete(`/cart/items/${itemId}/remove/`);
    return data;
  },
  clear: async () => {
    const { data } = await apiClient.delete("/cart/clear/");
    return data;
  },
};

export default cartApi;
