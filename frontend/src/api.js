import axios from "axios";

// Determine the API base URL
// Priority: VITE_API_BASE env var > window location > default localhost
const getApiBase = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // For development: use explicit localhost:8000
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://127.0.0.1:8000/api";
  }
  
  // For other hostnames, use the current hostname with port 8000
  return `http://${window.location.hostname}:8000/api`;
};

const API_BASE = getApiBase();

export const api = axios.create({
  baseURL: API_BASE,
});

export const adminApi = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("volunteer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
