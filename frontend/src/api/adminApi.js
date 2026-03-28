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

const computeRevenue = (orders) =>
  orders.reduce((total, order) => total + Number(order?.total_price || 0), 0);

const adminApi = {
  getDashboardStats: async () => {
    try {
      const { data } = await apiClient.get("/admin/dashboard/");
      return data;
    } catch (error) {
      const status = error?.response?.status;

      // Fallback for backends that don't expose /admin/dashboard/ yet.
      if (status === 404 || status === 405) {
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          apiClient.get("/users/"),
          apiClient.get("/products/"),
          apiClient.get("/orders/"),
        ]);

        const users = toList(usersRes.data);
        const products = toList(productsRes.data);
        const orders = toList(ordersRes.data);

        return {
          total_users: users.length,
          total_products: products.length,
          total_orders: orders.length,
          total_revenue: computeRevenue(orders),
        };
      }

      throw error;
    }
  },
};

export default adminApi;
