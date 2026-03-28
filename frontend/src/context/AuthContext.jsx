/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import authApi from "../api/authApi";
import { tokenStorage } from "../api/token";
import { getApiErrorMessage } from "../api/error";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user && tokenStorage.getAccess());
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    const hydrateUser = async () => {
      if (!tokenStorage.getAccess()) {
        setLoading(false);
        return;
      }

      try {
        const me = await authApi.me();
        setUser(me);
      } catch {
        tokenStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, []);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    tokenStorage.setTokens({ access: data.access, refresh: data.refresh });
    if (data.user) {
      setUser(data.user);
      return data.user;
    }
    const me = await authApi.me();
    setUser(me);
    return me;
  };

  const register = async (payload) => authApi.register(payload);

  const updateProfile = async (payload) => {
    const updated = await authApi.updateMe(payload);
    setUser(updated);
    return updated;
  };

  const logout = async () => {
    const refresh = tokenStorage.getRefresh();
    try {
      if (refresh) {
        await authApi.logout({ refresh });
      }
    } catch {
      // Ignore logout errors to allow local sign-out.
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      isAdmin,
      login,
      register,
      updateProfile,
      logout,
      setUser,
      getApiErrorMessage,
    }),
    [user, loading, isAuthenticated, isAdmin]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
