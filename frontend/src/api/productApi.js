import apiClient from "./axiosClient";

const productApi = {
  getProducts: async () => {
    const { data } = await apiClient.get("/products/");
    return data;
  },
  getProductById: async (productId) => {
    const { data } = await apiClient.get(`/products/${productId}/`);
    return data;
  },
  getProductReviews: async (productId) => {
    const { data } = await apiClient.get(`/products/${productId}/reviews/`);
    return data;
  },
  createProductReview: async (productId, payload) => {
    const { data } = await apiClient.post(`/products/${productId}/reviews/`, payload);
    return data;
  },
  updateProductReview: async (productId, reviewId, payload) => {
    const { data } = await apiClient.patch(`/products/${productId}/reviews/${reviewId}/`, payload);
    return data;
  },
  deleteProductReview: async (productId, reviewId) => {
    const { data } = await apiClient.delete(`/products/${productId}/reviews/${reviewId}/`);
    return data;
  },
  getCategories: async () => {
    const { data } = await apiClient.get("/categories/");
    return data;
  },
  createCategory: async (payload) => {
    const { data } = await apiClient.post("/categories/", payload);
    return data;
  },
  updateCategory: async (categoryId, payload) => {
    const { data } = await apiClient.put(`/categories/${categoryId}/`, payload);
    return data;
  },
  deleteCategory: async (categoryId) => {
    const { data } = await apiClient.delete(`/categories/${categoryId}/`);
    return data;
  },
  createProduct: async (payload) => {
    const isFormData = payload instanceof FormData;
    const { data } = await apiClient.post("/products/", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return data;
  },
  updateProduct: async (productId, payload) => {
    const isFormData = payload instanceof FormData;
    const { data } = await apiClient.put(`/products/${productId}/`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return data;
  },
  deleteProduct: async (productId) => {
    const { data } = await apiClient.delete(`/products/${productId}/`);
    return data;
  },
};

export default productApi;
