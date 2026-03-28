import apiClient from "./axiosClient";

const authApi = {
  login: async (payload) => {
    const requestPayload = {
      username: payload.username?.trim() || payload.identifier?.trim() || "",
      password: payload.password,
    };
    const { data } = await apiClient.post("/auth/login/", requestPayload);
    return data;
  },
  register: async (payload) => {
    const { data } = await apiClient.post("/auth/register/", payload);
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get("/users/me/");
    return data;
  },
  updateMe: async (payload) => {
    const isFormData = payload instanceof FormData;
    const { data } = await apiClient.patch("/users/me/", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return data;
  },
  logout: async (payload) => {
    const { data } = await apiClient.post("/auth/logout/", payload);
    return data;
  },
  getMyAddresses: async () => {
    const { data } = await apiClient.get("/users/me/addresses/");
    return data;
  },
  createMyAddress: async (payload) => {
    const { data } = await apiClient.post("/users/me/addresses/", payload);
    return data;
  },
  updateMyAddress: async (addressId, payload) => {
    const { data } = await apiClient.patch(`/users/me/addresses/${addressId}/`, payload);
    return data;
  },
  deleteMyAddress: async (addressId) => {
    const { data } = await apiClient.delete(`/users/me/addresses/${addressId}/`);
    return data;
  },
  setDefaultMyAddress: async (addressId) => {
    const { data } = await apiClient.patch(`/users/me/addresses/${addressId}/set-default/`);
    return data;
  },
};

export default authApi;
