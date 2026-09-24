import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout, { sidebarPages } from "./components/Layout";

import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ImportStudentsPage from "./pages/ImportStudentsPage";

function PlaceholderPage({ title }) {
  return (
    <main className="crm-placeholder">
      <h1>{title}</h1>
      <p>This page is ready for development.</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {sidebarPages
            .filter((page) => page.path !== "/dashboard")
            .map((page) => (
              <Route
                key={page.path}
                path={page.path}
                element={<PlaceholderPage title={page.label} />}
              />
            ))}

          <Route
            path="/emergency-lookup"
            element={<PlaceholderPage title="Emergency Lookup" />}
          />
        </Route>
      </Route>
<<<<<<< HEAD
      <Route path="*" element={<Navigate to="/dashboard" replace />} />

      
      <Route path="/students/import" element={<ImportStudentsPage />}/>
=======

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
>>>>>>> origin/tshewang
    </Routes>
  );
}