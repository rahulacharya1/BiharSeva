import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PrivateRoute — Protects routes that require authentication.
 *
 * @param {"volunteer" | "admin"} role - Which auth role is required
 * @param {React.ReactNode} children - The page component to render
 * @param {string} [redirectTo] - Override the default redirect path
 */
export function PrivateRoute({ role = "volunteer", children, redirectTo }) {
  const { volunteer, adminUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (role === "volunteer" && !volunteer) {
    return (
      <Navigate
        to={redirectTo || "/volunteer/login"}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (role === "admin" && !adminUser) {
    return (
      <Navigate
        to={redirectTo || "/admin/login"}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
}
