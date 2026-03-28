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
        addresses: withBase("users/me/addresses/"),
        addressDetail: (id) => withBase(`users/me/addresses/${id}/`),
        setDefaultAddress: (id) => withBase(`users/me/addresses/${id}/set-default/`),
    },
    categories: {
        list: withBase("categories/"),
        detail: (id) => withBase(`categories/${id}/`),
    },
    products: {
        list: withBase("products/"),
        detail: (productId) => withBase(`products/${productId}/`),
        reviews: (productId) => withBase(`products/${productId}/reviews/`),
        reviewDetail: (productId, reviewId) => withBase(`products/${productId}/reviews/${reviewId}/`),
        images: (productId) => withBase(`products/${productId}/images/`),
        imageDetail: (productId, imageId) => withBase(`products/${productId}/images/${imageId}/`),
        setPrimaryImage: (productId, imageId) =>
            withBase(`products/${productId}/images/${imageId}/set-primary/`),
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