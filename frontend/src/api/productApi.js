import apiClient from "./axiosClient";

const toList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};

const normalizeProduct = (product) => {
  const imageFromImages = Array.isArray(product?.images)
    ? product.images.find((image) => image.is_primary)?.image_url || product.images[0]?.image_url
    : "";

  const productId = product?.product_id || product?.id || "";
  const stock = product?.stock ?? product?.stock_quantity ?? 0;
  const image = product?.product_image || product?.product_image_file_url || imageFromImages || "";

  return {
    ...product,
    product_id: productId,
    stock,
    product_image: image,
    product_image_file_url: product?.product_image_file_url || image,
  };
};

const productApi = {
  getProducts: async (params = {}) => {
    const { data } = await apiClient.get("/products/", { params });
    return toList(data).map(normalizeProduct);
  },
  getProductById: async (productId) => {
    const { data } = await apiClient.get(`/products/${productId}/`);
    return normalizeProduct(data);
  },
  getProductReviews: async (productId) => {
    const { data } = await apiClient.get(`/products/${productId}/reviews/`);
    return toList(data);
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
    return toList(data);
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
    return normalizeProduct(data);
  },
  updateProduct: async (productId, payload) => {
    const isFormData = payload instanceof FormData;
    const { data } = await apiClient.put(`/products/${productId}/`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return normalizeProduct(data);
  },
  patchProduct: async (productId, payload) => {
    const isFormData = payload instanceof FormData;
    const { data } = await apiClient.patch(`/products/${productId}/`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return normalizeProduct(data);
  },
  deleteProduct: async (productId) => {
    const { data } = await apiClient.delete(`/products/${productId}/`);
    return data;
  },
  getProductImages: async (productId) => {
    const { data } = await apiClient.get(`/products/${productId}/images/`);
    return toList(data);
  },
  addProductImage: async (productId, payload) => {
    const { data } = await apiClient.post(`/products/${productId}/images/`, payload);
    return data;
  },
  updateProductImage: async (productId, imageId, payload) => {
    const { data } = await apiClient.patch(`/products/${productId}/images/${imageId}/`, payload);
    return data;
  },
  setPrimaryProductImage: async (productId, imageId) => {
    const { data } = await apiClient.patch(`/products/${productId}/images/${imageId}/set-primary/`);
    return data;
  },
  deleteProductImage: async (productId, imageId) => {
    const { data } = await apiClient.delete(`/products/${productId}/images/${imageId}/`);
    return data;
  },
};

export default productApi;
