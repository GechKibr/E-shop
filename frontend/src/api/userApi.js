import apiClient from "./axiosClient";

const userApi = {
  getUsers: async () => {
    const { data } = await apiClient.get("/users/");
    return data;
  },
  deleteUser: async (userId) => {
    const { data } = await apiClient.delete(`/users/${userId}/`);
    return data;
  },
  updateUserRole: async (userId, role) => {
    const { data } = await apiClient.patch(`/users/${userId}/role/`, { role });
    return data;
  },
};

export default userApi;
