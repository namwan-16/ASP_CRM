import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function isAdministrator(user) {
  const role = String(user?.role ?? "")
    .trim()
    .toLowerCase();

  return Boolean(
    user?.can_manage ||
    user?.is_superuser ||
    ["admin", "administrator", "administration"].includes(role),
  );
}

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="screen-message">Loading ASP CRM…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdministrator(user)) {
    return <Navigate to="/classes" replace />;
  }

  return <Outlet />;
}
