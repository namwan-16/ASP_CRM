import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import Students from "./pages/Students";
import Guardians from "./pages/Guardians";
import Classes from "./pages/Classes";
import EmergencyLookup from "./pages/EmergencyLookup";
import ProgressNotes from "./pages/ProgressNotes";
import Reports from "./pages/Reports";
import Attendance from "./pages/Attendance";
import Registrations from "./pages/Registrations";
import Staff from "./pages/Staff";
import "./features.css";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<Students />} />
          <Route path="/guardians" element={<Guardians />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/progress-notes" element={<ProgressNotes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/registrations" element={<Registrations />} />
          <Route path="/staff" element={<Staff />} />

          <Route
            path="/emergency-lookup"
            element={<EmergencyLookup />} />
        </Route>
        
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
