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
  withCredentials: true,
});

export const adminApi = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
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

// Queue management for refreshing volunteer tokens
let isRefreshingVolunteer = false;
let volunteerQueue = [];

const processVolunteerQueue = (error, token = null) => {
  volunteerQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  volunteerQueue = [];
};

// Queue management for refreshing admin tokens
let isRefreshingAdmin = false;
let adminQueue = [];

const processAdminQueue = (error, token = null) => {
  adminQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  adminQueue = [];
};

export const setupInterceptors = (toast, volunteerLogout, adminLogout) => {
  // Response interceptor for volunteer API
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (!error.response) {
        return Promise.reject(error);
      }

      const status = error.response.status;

      // Handle 401 Unauthorized - Attempt Token Refresh
      if (status === 401 && !originalRequest._retry) {
        if (originalRequest.url.includes("/token/refresh/")) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshingVolunteer) {
          return new Promise((resolve, reject) => {
            volunteerQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshingVolunteer = true;

        try {
          const res = await axios.post(`${API_BASE}/token/refresh/`, {}, { withCredentials: true });
          const newToken = res.data.token;
          
          processVolunteerQueue(null, newToken);
          isRefreshingVolunteer = false;
          
          return api(originalRequest);
        } catch (refreshErr) {
          processVolunteerQueue(refreshErr, null);
          isRefreshingVolunteer = false;
          volunteerLogout();
          toast.error("Session expired. Please log in again.");
          return Promise.reject(refreshErr);
        }
      }

      // Handle other global error codes
      if (status === 403) {
        toast.error(error.response.data?.detail || "You do not have permission to perform this action.");
      } else if (status >= 500) {
        toast.error("A server error occurred. Please try again later.");
      }

      return Promise.reject(error);
    }
  );

  // Response interceptor for admin API
  adminApi.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (!error.response) {
        return Promise.reject(error);
      }

      const status = error.response.status;

      // Handle 401 Unauthorized - Attempt Token Refresh
      if (status === 401 && !originalRequest._retry) {
        if (originalRequest.url.includes("/token/refresh/")) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshingAdmin) {
          return new Promise((resolve, reject) => {
            adminQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return adminApi(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        isRefreshingAdmin = true;

        try {
          const res = await axios.post(`${API_BASE}/token/refresh/`, {}, { withCredentials: true });
          const newToken = res.data.token;
          
          processAdminQueue(null, newToken);
          isRefreshingAdmin = false;
          
          return adminApi(originalRequest);
        } catch (refreshErr) {
          processAdminQueue(refreshErr, null);
          isRefreshingAdmin = false;
          adminLogout();
          toast.error("Admin session expired. Please log in again.");
          return Promise.reject(refreshErr);
        }
      }

      // Handle other global error codes
      if (status === 403) {
        toast.error(error.response.data?.detail || "You do not have permission to perform this action.");
      } else if (status >= 500) {
        toast.error("A server error occurred. Please try again later.");
      }

      return Promise.reject(error);
    }
  );
};
