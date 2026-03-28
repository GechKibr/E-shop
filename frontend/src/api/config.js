const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

const withBase = (path) => `${API_BASE_URL}/${path}`;

export const ENDPOINTS = {
    auth: {
        register: withBase("auth/register/"),
        login: withBase("auth/login/"),
        logout: withBase("auth/logout/"),
        refresh: withBase("auth/refresh/"),
    },
    users: {
        me: withBase("users/me/"),
        list: withBase("users/"),
        detail: (id) => withBase(`users/${id}/`),
        updateRole: (id) => withBase(`users/${id}/role/`),
    },
    categories: {
        list: withBase("categories/"),
        detail: (id) => withBase(`categories/${id}/`),
    },
    products: {
        list: withBase("products/"),
        detail: (productId) => withBase(`products/${productId}/`),
    },
    cart: {
        detail: withBase("cart/"),
        addItem: withBase("cart/items/"),
        updateItem: (itemId) => withBase(`cart/items/${itemId}/`),
        removeItem: (itemId) => withBase(`cart/items/${itemId}/remove/`),
        clear: withBase("cart/clear/"),
    },
    orders: {
        listCreate: withBase("orders/"),
        detail: (orderId) => withBase(`orders/${orderId}/`),
    },
};

export { API_BASE_URL };