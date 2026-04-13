import axios from "axios";

const defaultApiBase = `http://${window.location.hostname}:8000/api`;
const API_BASE = import.meta.env.VITE_API_BASE || defaultApiBase;

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
