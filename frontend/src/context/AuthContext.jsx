/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import authApi from "../api/authApi";
import { tokenStorage } from "../api/token";
import { getApiErrorMessage } from "../api/error";

const AuthContext = createContext(null);

const normalizeUser = (rawUser) => {
  if (!rawUser) {
    return null;
  }

  const role = rawUser.role || (rawUser.is_staff ? "Admin" : "Customer");
  return {
    ...rawUser,
    role,
    addresses: Array.isArray(rawUser.addresses) ? rawUser.addresses : [],
    profile: rawUser.profile || {},
    phone_number: rawUser.phone_number || rawUser.profile?.phone_number || "",
    bio: rawUser.bio || rawUser.profile?.bio || "",
    avatar: rawUser.avatar || rawUser.profile?.avatar || "",
  };
};

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
        setUser(normalizeUser(me));
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
      const normalized = normalizeUser(data.user);
      setUser(normalized);
      return normalized;
    }
    const me = await authApi.me();
    const normalized = normalizeUser(me);
    setUser(normalized);
    return normalized;
  };

  const register = async (payload) => authApi.register(payload);

  const refreshUser = async () => {
    const me = await authApi.me();
    const normalized = normalizeUser(me);
    setUser(normalized);
    return normalized;
  };

  const updateProfile = async (payload) => {
    const updated = await authApi.updateMe(payload);
    const normalized = normalizeUser(updated);
    setUser(normalized);
    return normalized;
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
      refreshUser,
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
