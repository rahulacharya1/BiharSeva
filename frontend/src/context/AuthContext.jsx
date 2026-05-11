import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api, adminApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [volunteer, setVolunteer] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap auth state from stored tokens on mount
  useEffect(() => {
    const promises = [];

    const volunteerToken = localStorage.getItem("volunteer_token");
    if (volunteerToken) {
      promises.push(
        api
          .get("/volunteers/me/")
          .then((res) => setVolunteer(res.data.volunteer))
          .catch(() => {
            localStorage.removeItem("volunteer_token");
            setVolunteer(null);
          })
      );
    }

    const adminToken = localStorage.getItem("admin_token");
    if (adminToken) {
      promises.push(
        adminApi
          .get("/admin/auth/me/")
          .then((res) =>
            setAdminUser({
              username: res.data.username,
              admin_role: res.data.admin_role,
              admin_college_id: res.data.admin_college_id,
              admin_college_name: res.data.admin_college_name,
            })
          )
          .catch(() => {
            localStorage.removeItem("admin_token");
            setAdminUser(null);
          })
      );
    }

    Promise.allSettled(promises).finally(() => setLoading(false));
  }, []);

  const handleVolunteerLogin = useCallback((payload) => {
    localStorage.setItem("volunteer_token", payload.token);
    setVolunteer(payload.volunteer);
  }, []);

  const handleVolunteerLogout = useCallback(() => {
    localStorage.removeItem("volunteer_token");
    setVolunteer(null);
  }, []);

  const handleAdminLogin = useCallback((adminData) => {
    setAdminUser(adminData);
  }, []);

  const handleAdminLogout = useCallback(() => {
    localStorage.removeItem("admin_token");
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
