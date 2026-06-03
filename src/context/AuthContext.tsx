"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { refreshToken as refreshTokenAPI } from "@/services/auth.service";
import { toast } from "react-toastify";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  is_active: boolean;
  is_superuser?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isSuperuser: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiry: number | null;
  refreshTokenExpiry: number | null;
  setAuth: (user: User, accessToken: string, refreshToken: string, accessTokenExpiry: number, refreshTokenExpiry: number) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh 5 minutes before expiry

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accessTokenExpiry, setAccessTokenExpiry] = useState<number | null>(null);
  const [refreshTokenExpiry, setRefreshTokenExpiry] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    const storedAccessTokenExpiry = localStorage.getItem("accessTokenExpiry");
    const storedRefreshTokenExpiry = localStorage.getItem("refreshTokenExpiry");

    if (storedUser && storedAccessToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setAccessTokenExpiry(storedAccessTokenExpiry ? parseInt(storedAccessTokenExpiry, 10) : null);
        setRefreshTokenExpiry(storedRefreshTokenExpiry ? parseInt(storedRefreshTokenExpiry, 10) : null);
      } catch (error) {
        console.error("Failed to parse stored auth data", error);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("accessTokenExpiry");
        localStorage.removeItem("refreshTokenExpiry");
      }
    }

    setIsHydrated(true);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing || !refreshToken) {
      return;
    }

    try {
      setIsRefreshing(true);
      const response = await refreshTokenAPI(refreshToken);
      const newAccessToken = response.data.tokens.access.token;
      const newAccessTokenExpiry = response.data.tokens.access.expires;
      const newRefreshToken = response.data.tokens.refresh.token;
      const newRefreshTokenExpiry = response.data.tokens.refresh.expires;

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setAccessTokenExpiry(newAccessTokenExpiry);
      setRefreshTokenExpiry(newRefreshTokenExpiry);

      localStorage.setItem("accessToken", newAccessToken);
      localStorage.setItem("refreshToken", newRefreshToken);
      localStorage.setItem("accessTokenExpiry", String(newAccessTokenExpiry));
      localStorage.setItem("refreshTokenExpiry", String(newRefreshTokenExpiry));
    } catch (error) {
      console.error("Token refresh failed", error);
      // Clear auth and redirect to login on refresh failure
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setAccessTokenExpiry(null);
      setRefreshTokenExpiry(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("accessTokenExpiry");
      localStorage.removeItem("refreshTokenExpiry");
      router.push("/login");
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, isRefreshing, router]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!accessTokenExpiry || !isHydrated) return;

    const now = Date.now();
    const timeUntilExpiry = accessTokenExpiry - now;

    if (timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
      refreshAccessToken();
    }

    // Set up interval to check token expiry every minute
    const interval = setInterval(() => {
      const currentNow = Date.now();
      const currentTimeUntilExpiry = accessTokenExpiry - currentNow;

      if (currentTimeUntilExpiry <= TOKEN_REFRESH_THRESHOLD && currentTimeUntilExpiry > 0) {
        refreshAccessToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [accessTokenExpiry, isHydrated, refreshAccessToken]);

  const setAuth = (
    newUser: User,
    newAccessToken: string,
    newRefreshToken: string,
    newAccessTokenExpiry: number,
    newRefreshTokenExpiry: number
  ) => {
    setUser(newUser);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setAccessTokenExpiry(newAccessTokenExpiry);
    setRefreshTokenExpiry(newRefreshTokenExpiry);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("accessTokenExpiry", String(newAccessTokenExpiry));
    localStorage.setItem("refreshTokenExpiry", String(newRefreshTokenExpiry));
  };

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setAccessTokenExpiry(null);
    setRefreshTokenExpiry(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessTokenExpiry");
    localStorage.removeItem("refreshTokenExpiry");
    router.push("/login");
  }, [router]);
 
  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  // Intercept unauthorized requests (401 status) globally
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        let url = "";
        if (typeof args[0] === "string") {
          url = args[0];
        } else if (args[0] instanceof URL) {
          url = args[0].toString();
        } else if (args[0] && typeof args[0] === "object" && "url" in args[0]) {
          url = (args[0] as any).url;
        }

        // Do not trigger logout for login endpoint itself
        if (url && !url.includes("/auth/login")) {
          // Only trigger logout if there is an active session in local storage
          if (localStorage.getItem("accessToken") || localStorage.getItem("user")) {
            console.warn("Unauthorized API access detected, logging out...");
            toast.error("Session expired. Please log in again.");
            logout();
          }
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);

  // Protect routes
  useEffect(() => {
    if (!isHydrated) return;

    const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/signup");
    const isProtectedRoute = !isAuthRoute;

    if (isProtectedRoute && !user) {
      router.push("/login");
    }

    if (isAuthRoute && user) {
      router.push("/");
    }
  }, [isHydrated, user, pathname, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSuperuser: !!user?.is_superuser,
        accessToken,
        refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
        setAuth,
        logout,
        refreshAccessToken,
        updateUser,
      }}
    >
      {isHydrated ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
