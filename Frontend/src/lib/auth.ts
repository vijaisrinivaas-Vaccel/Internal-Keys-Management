export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const ACCESS_TOKEN_KEY = "token";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token: string) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAuth = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem("user");
};

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Token refresh failed:", res.status);
      return null;
    }

    const data = await res.json();
    if (!data.accessToken) return null;

    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
};

export const authFetch = async (
  url: string,
  init: RequestInit = {}
): Promise<Response> => {
  // First attempt with current token
  const token = getAccessToken();
  const headers = new Headers(init.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  // If unauthorized and we have a token, try to refresh once
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(init.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, {
        ...init,
        headers: retryHeaders,
        credentials: "include",
      });
    }
  }

  // Handle Maintenance Mode in real-time
  if (response.status === 503) {
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data.message === "UNDER_MAINTENANCE") {
        window.dispatchEvent(new CustomEvent("app-maintenance-active"));
      }
    } catch {
      // Ignored if not JSON
    }
  }

  return response;
};

export const getMe = () => authFetch(`${API_BASE_URL}/auth/me`);

export const loginRequest = (email: string, password: string) =>
  fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

export const registerRequest = (body: unknown) =>
  fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const logoutRequest = () =>
  authFetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
  });
