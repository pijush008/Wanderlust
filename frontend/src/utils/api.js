import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wanderlust_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/")) {
      localStorage.removeItem("wanderlust_token");
      localStorage.removeItem("wanderlust_user");
    }
    return Promise.reject(err);
  }
);

export default api;
