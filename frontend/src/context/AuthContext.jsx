import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!localStorage.getItem("accessToken")) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me/");
        setUser(response.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentUser();
  }, []);

  const login = async (email, password) => {
    const tokenResponse = await api.post("/auth/login/", {
      email: email.trim().toLowerCase(),
      password,
    });
    localStorage.setItem("accessToken", tokenResponse.data.access);
    localStorage.setItem("refreshToken", tokenResponse.data.refresh);

    const userResponse = await api.get("/auth/me/");
    setUser(userResponse.data);
    return userResponse.data;
  };

  const updateProfile = async (details) => {
    const response = await api.patch("/auth/me/", details);
    setUser(response.data);
    return response.data;
  };

  const clearSession = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const register = (formData) => api.post("/auth/register/", formData);

  const logout = async () => {
    const refresh = localStorage.getItem("refreshToken");
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } finally {
      clearSession();
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      clearSession,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
