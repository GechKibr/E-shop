/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import cartApi from "../api/cartApi";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const cartCount = useMemo(
    () => cart?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0,
    [cart]
  );

  const cartTotal = useMemo(() => Number(cart?.total_price || 0), [cart]);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      return null;
    }
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    const data = await cartApi.addItem({ product_id: productId, quantity });
    setCart(data);
    return data;
  };

  const updateCartItem = async (itemId, quantity) => {
    const data = await cartApi.updateItem(itemId, quantity);
    setCart(data);
    return data;
  };

  const removeCartItem = async (itemId) => {
    const data = await cartApi.removeItem(itemId);
    setCart(data);
    return data;
  };

  const clearCart = async () => {
    const data = await cartApi.clear();
    setCart(data);
    return data;
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      cartCount,
      cartTotal,
      refreshCart,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart,
    }),
    [cart, loading, cartCount, cartTotal, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
