"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { refreshToken as refreshTokenAPI, logout as logoutAPI } from "@/services/auth.service";
import { toast } from "react-toastify";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  is_active: boolean;
  is_superuser?: boolean;
  is_trustee?: boolean;
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

const STORAGE_KEYS = [
  "user",
  "accessToken",
  "refreshToken",
  "accessTokenExpiry",
  "refreshTokenExpiry",
] as const;

/**
 * The backend returns token `expires` as a Unix timestamp in SECONDS, but all
 * expiry math here compares against Date.now() (MILLISECONDS). Normalize to ms.
 * Idempotent: a value already in ms (~1.7e12) is left untouched, while a seconds
 * value (~1.7e9) is scaled up — so both fresh logins and any already-stored
 * seconds values hydrate correctly.
 */
function toEpochMs(expires: number): number {
  if (!Number.isFinite(expires)) return expires;
  return expires < 1e12 ? expires * 1000 : expires;
}

/** URLs that must never trigger a refresh-and-retry (avoids recursion). */
function isAuthEndpoint(url: string): boolean {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

/** Rebuild a fetch call's init with a fresh bearer token for the retry. */
function withAuthHeader(init: RequestInit | undefined, token: string): RequestInit {
  const headers = new Headers(init?.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accessTokenExpiry, setAccessTokenExpiry] = useState<number | null>(null);
  const [refreshTokenExpiry, setRefreshTokenExpiry] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  // Single-flight refresh: all concurrent 401s share this one promise.
  const refreshPromiseRef = useRef<Promise<string> | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const hydrateFromStorage = useCallback(() => {
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
        setAccessTokenExpiry(storedAccessTokenExpiry ? toEpochMs(parseInt(storedAccessTokenExpiry, 10)) : null);
        setRefreshTokenExpiry(storedRefreshTokenExpiry ? toEpochMs(parseInt(storedRefreshTokenExpiry, 10)) : null);
      } catch (error) {
        console.error("Failed to parse stored auth data", error);
        STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
      }
    } else {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setAccessTokenExpiry(null);
      setRefreshTokenExpiry(null);
    }
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    hydrateFromStorage();
    setIsHydrated(true);
  }, [hydrateFromStorage]);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setAccessTokenExpiry(null);
    setRefreshTokenExpiry(null);
    STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
  }, []);

  /**
   * Single-flight token refresh. Reads the refresh token from localStorage
   * (source of truth, avoids stale closures) and resolves to the new access
   * token so callers can retry. On failure it clears auth and redirects.
   */
  const performRefresh = useCallback((): Promise<string> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const storedRefresh = localStorage.getItem("refreshToken");
    const storedRefreshExpiry = localStorage.getItem("refreshTokenExpiry");
    if (!storedRefresh) {
      return Promise.reject(new Error("No refresh token"));
    }
    if (storedRefreshExpiry && toEpochMs(parseInt(storedRefreshExpiry, 10)) <= Date.now()) {
      clearAuthState();
      router.push("/login");
      return Promise.reject(new Error("Refresh token expired"));
    }

    const promise = (async () => {
      try {
        const response = await refreshTokenAPI(storedRefresh);
        const tokens = response.data.tokens;
        const accessExpiryMs = toEpochMs(tokens.access.expires);
        const refreshExpiryMs = toEpochMs(tokens.refresh.expires);
        setAccessToken(tokens.access.token);
        setRefreshToken(tokens.refresh.token);
        setAccessTokenExpiry(accessExpiryMs);
        setRefreshTokenExpiry(refreshExpiryMs);
        localStorage.setItem("accessToken", tokens.access.token);
        localStorage.setItem("refreshToken", tokens.refresh.token);
        localStorage.setItem("accessTokenExpiry", String(accessExpiryMs));
        localStorage.setItem("refreshTokenExpiry", String(refreshExpiryMs));
        return tokens.access.token;
      } catch (error) {
        console.error("Token refresh failed");
        clearAuthState();
        router.push("/login");
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [clearAuthState, router]);

  const refreshAccessToken = useCallback(async () => {
    await performRefresh().catch(() => {});
  }, [performRefresh]);

  // Auto-refresh: fire when within the threshold OR already expired (but the
  // refresh token is still valid). The old `timeUntilExpiry > 0` guard skipped
  // already-expired-but-refreshable tokens, forcing an unnecessary logout.
  useEffect(() => {
    if (!isHydrated || !accessTokenExpiry) return;

    const check = () => {
      const timeUntilExpiry = accessTokenExpiry - Date.now();
      if (timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD) {
        performRefresh().catch(() => {});
      }
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [accessTokenExpiry, isHydrated, performRefresh]);

  const setAuth = (
    newUser: User,
    newAccessToken: string,
    newRefreshToken: string,
    newAccessTokenExpiry: number,
    newRefreshTokenExpiry: number
  ) => {
    const accessExpiryMs = toEpochMs(newAccessTokenExpiry);
    const refreshExpiryMs = toEpochMs(newRefreshTokenExpiry);
    setUser(newUser);
    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setAccessTokenExpiry(accessExpiryMs);
    setRefreshTokenExpiry(refreshExpiryMs);
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);
    localStorage.setItem("accessTokenExpiry", String(accessExpiryMs));
    localStorage.setItem("refreshTokenExpiry", String(refreshExpiryMs));
  };

  const logout = useCallback(() => {
    // Best-effort server-side logout so the refresh token is revoked; never
    // block the client-side cleanup on its result.
    const storedRefresh = localStorage.getItem("refreshToken");
    const storedAccess = localStorage.getItem("accessToken");
    if (storedRefresh && storedAccess) {
      logoutAPI(storedRefresh, storedAccess).catch(() => {});
    }
    clearAuthState();
    router.push("/login");
  }, [clearAuthState, router]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newUser = { ...prev, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  // Keep the latest callbacks in refs so the fetch interceptor can be installed
  // exactly once (installing/uninstalling on every render corrupts window.fetch).
  const performRefreshRef = useRef(performRefresh);
  const logoutRef = useRef(logout);
  useEffect(() => {
    performRefreshRef.current = performRefresh;
    logoutRef.current = logout;
  });

  // Global 401 handling: refresh-then-retry once, and only log out if the
  // refresh itself fails. Replaces the old "force logout on first 401".
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      if (response.status !== 401) return response;

      const input = args[0];
      let url = "";
      if (typeof input === "string") url = input;
      else if (input instanceof URL) url = input.toString();
      else if (input && typeof input === "object" && "url" in input) url = (input as Request).url;

      // Never refresh-retry auth endpoints, and only when a session exists.
      if (!url || isAuthEndpoint(url)) return response;
      if (!localStorage.getItem("accessToken") && !localStorage.getItem("user")) return response;

      try {
        const newToken = await performRefreshRef.current();
        // Retry the original request once with the refreshed token.
        return await originalFetch(args[0], withAuthHeader(args[1], newToken));
      } catch {
        toast.error("Session expired. Please log in again.");
        logoutRef.current();
        return response;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Cross-tab sync: react to auth changes made in other tabs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || (STORAGE_KEYS as readonly string[]).includes(e.key)) {
        const stillLoggedIn = localStorage.getItem("accessToken") && localStorage.getItem("user");
        if (!stillLoggedIn) {
          clearAuthState();
          if (pathname && !pathname.startsWith("/login")) router.push("/login");
        } else {
          hydrateFromStorage();
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [clearAuthState, hydrateFromStorage, pathname, router]);

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
