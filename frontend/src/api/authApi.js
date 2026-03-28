import apiClient from "./axiosClient";

const authApi = {
  login: async (payload) => {
    const { data } = await apiClient.post("/auth/login/", payload);
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
    const { data } = await apiClient.patch("/users/me/", payload);
    return data;
  },
  logout: async (payload) => {
    const { data } = await apiClient.post("/auth/logout/", payload);
    return data;
  },
};

export default authApi;
