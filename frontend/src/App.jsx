import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import Students from "./pages/Students";
import Guardians from "./pages/Guardians";
import Classes from "./pages/Classes";
<<<<<<< HEAD
import Subjects from "./pages/Subjects";
=======
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
import EmergencyLookup from "./pages/EmergencyLookup";
import ProgressNotes from "./pages/ProgressNotes";
import Reports from "./pages/Reports";
import Attendance from "./pages/Attendance";
import Registrations from "./pages/Registrations";
import Staff from "./pages/Staff";
<<<<<<< HEAD
import Profile from "./pages/Profile";

import "./features.css";

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
=======
import "./features.css";

>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b

function RoleHomeRedirect() {
  const { user } = useAuth();

  return (
    <Navigate to={isAdministrator(user) ? "/dashboard" : "/classes"} replace />
  );
}

function AdminOnlyRoute() {
  const { user } = useAuth();

  if (!isAdministrator(user)) {
    return <Navigate to="/classes" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<RoleHomeRedirect />} />

          <Route element={<AdminOnlyRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<Students />} />
            <Route path="/guardians" element={<Guardians />} />
            <Route path="/registrations" element={<Registrations />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/staff" element={<Staff />} />
          </Route>

          <Route path="/classes" element={<Classes />} />
<<<<<<< HEAD
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/progress-notes" element={<ProgressNotes />} />
          <Route path="/emergency-lookup" element={<EmergencyLookup />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="*" element={<RoleHomeRedirect />} />
=======
          <Route path="/progress-notes" element={<ProgressNotes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/registrations" element={<Registrations />} />
          <Route path="/staff" element={<Staff />} />

          <Route
            path="/emergency-lookup"
            element={<EmergencyLookup />} />
>>>>>>> dda7cbdf8a2dfeffcfee0a8fae30e97e0d7fed2b
        </Route>
        
      </Route>
    </Routes>
  );
}
