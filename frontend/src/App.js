import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login               from "./pages/Login";
import DirecteurDashboard  from "./pages/directeur/Dashboard";
import SurveillantDashboard from "./pages/surveillant/Dashboard";
import FormateurDashboard  from "./pages/formateur/Dashboard";

// Redirection automatique selon le rôle
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const redirects = {
    directeur:   "/directeur/dashboard",
    surveillant: "/surveillant/dashboard",
    formateur:   "/formateur/dashboard",
  };
  return <Navigate to={redirects[user.role] || "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Page publique */}
          <Route path="/login" element={<Login />} />

          {/* Accueil → redirige selon rôle */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Directeur */}
          <Route path="/directeur/dashboard" element={
            <ProtectedRoute roles={["directeur"]}>
              <DirecteurDashboard />
            </ProtectedRoute>
          } />

          {/* Surveillant */}
          <Route path="/surveillant/dashboard" element={
            <ProtectedRoute roles={["surveillant"]}>
              <SurveillantDashboard />
            </ProtectedRoute>
          } />

          {/* Formateur */}
          <Route path="/formateur/dashboard" element={
            <ProtectedRoute roles={["formateur"]}>
              <FormateurDashboard />
            </ProtectedRoute>
          } />

          {/* 404 → retour accueil */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}