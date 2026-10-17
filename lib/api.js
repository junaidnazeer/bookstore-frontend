import axios from "axios";

// Central place all pages/components call through, so the API base URL
// only ever needs to change in one spot (.env.local).
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
});

// Attach the auth token automatically if one is stored. Checks localStorage
// first (a "remembered" session), then sessionStorage (a session-only login
// from unchecking "Remember me") — either way the token gets attached.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token =
      window.localStorage.getItem("token") ||
      window.sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// The backend answers 401 for a missing, invalid or expired token (and for a
// deactivated or deleted account). When that happens, clear the saved login
// and send the user to the login page instead of leaving the app half logged
// in. 403 means "not allowed" (admin only / someone else's data), so it must
// NOT log the user out.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window === "undefined") return Promise.reject(err);

    const status = err?.response?.status;
    const url = err?.config?.url || "";

    const badToken = status === 401;
    const isAuthCall = url.startsWith("/auth/");

    if (badToken && !isAuthCall) {
      const hadToken =
        window.localStorage.getItem("token") ||
        window.sessionStorage.getItem("token");
      if (hadToken) {
        ["token", "role", "userName", "userEmail"].forEach((k) => {
          window.localStorage.removeItem(k);
          window.sessionStorage.removeItem(k);
        });
        const path = window.location.pathname;
        if (!path.startsWith("/login") && !path.startsWith("/admin/login")) {
          window.location.href = path.startsWith("/admin")
            ? "/admin/login"
            : `/login?redirect=${encodeURIComponent(path)}`;
        }
      }
    }
    return Promise.reject(err);
  },
);

export default api;
