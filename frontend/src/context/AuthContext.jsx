import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api, adminApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [volunteer, setVolunteer] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap auth state from cookies on mount
  useEffect(() => {
    const promises = [];

    // Fetch volunteer profile
    promises.push(
      api
        .get("/volunteers/me/", { skipToast: true, _skipRefresh: true })
        .then((res) => setVolunteer(res.data.volunteer))
        .catch(() => setVolunteer(null))
    );

    // Fetch admin profile
    promises.push(
      adminApi
        .get("/admin/auth/me/", { skipToast: true, _skipRefresh: true })
        .then((res) =>
          setAdminUser({
            username: res.data.username,
            admin_role: res.data.admin_role,
            admin_college_id: res.data.admin_college_id,
            admin_college_name: res.data.admin_college_name,
          })
        )
        .catch(() => setAdminUser(null))
    );

    Promise.allSettled(promises).finally(() => setLoading(false));
  }, []);

  const handleVolunteerLogin = useCallback((payload) => {
    if (payload.token) {
      localStorage.setItem("volunteer_token", payload.token);
    }
    if (payload.refresh_token) {
      localStorage.setItem("volunteer_refresh_token", payload.refresh_token);
    }
    setVolunteer(payload.volunteer);
  }, []);

  const handleVolunteerLogout = useCallback(async () => {
    try {
      await api.post("/volunteers/logout/");
    } catch (err) {
      console.error("Volunteer logout failed on server", err);
    }
    localStorage.removeItem("volunteer_token");
    localStorage.removeItem("volunteer_refresh_token");
    setVolunteer(null);
  }, []);

  const handleAdminLogin = useCallback((payload) => {
    if (payload.token) {
      localStorage.setItem("admin_token", payload.token);
    }
    if (payload.refresh_token) {
      localStorage.setItem("admin_refresh_token", payload.refresh_token);
    }
    setAdminUser(payload.adminUser);
  }, []);

  const handleAdminLogout = useCallback(async () => {
    try {
      await adminApi.post("/admin/auth/logout/");
    } catch (err) {
      console.error("Admin logout failed on server", err);
    }
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_refresh_token");
    setAdminUser(null);
  }, []);

  const value = useMemo(
    () => ({
      volunteer,
      adminUser,
      loading,
      handleVolunteerLogin,
      handleVolunteerLogout,
      handleAdminLogin,
      handleAdminLogout,
    }),
    [volunteer, adminUser, loading, handleVolunteerLogin, handleVolunteerLogout, handleAdminLogin, handleAdminLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
