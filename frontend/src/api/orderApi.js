import apiClient from "./axiosClient";

const orderApi = {
  getOrders: async () => {
    const { data } = await apiClient.get("/orders/");
    return data;
  },
  createOrder: async (payload) => {
    const { data } = await apiClient.post("/orders/", payload);
    return data;
  },
  updateOrder: async (orderId, payload) => {
    const { data } = await apiClient.put(`/orders/${orderId}/`, payload);
    return data;
  },
};

export default orderApi;
