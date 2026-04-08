import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home                  from "./pages/Home";
import Login                 from "./pages/Login";
import EspaceStagiaire       from "./pages/EspaceStagiaire";
import AdminLayout           from "./components/admin/AdminLayout";
import DirecteurDashboard    from "./pages/directeur/Dashboard";
import DirecteurFormateurs   from "./pages/directeur/Formateurs";
import DirecteurSurveillants from "./pages/directeur/Surveillants";
import DirecteurGroupes      from "./pages/directeur/Groupes";
import DirecteurModules      from "./pages/directeur/Modules";
import DirecteurImport       from "./pages/directeur/ImportExcel";
import SurveillantDashboard  from "./pages/surveillant/Dashboard";
import FormateurDashboard    from "./pages/formateur/Dashboard";
import DirecteurPole         from "./pages/directeur/Pole";
import DirecteurAlertes      from "./pages/directeur/Alertes";



function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/home" replace />;
  const redirects = {
    directeur:   "/directeur/dashboard",
    surveillant: "/surveillant/dashboard",
    formateur:   "/formateur/dashboard",
    stagiaire:   "/stagiaire/espace",
  };
  return <Navigate to={redirects[user.role] || "/home"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Pages publiques */}
          <Route path="/home"  element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/"      element={<HomeRedirect />} />

          {/* Espace Stagiaire */}
          <Route path="/stagiaire/espace" element={<EspaceStagiaire />} />

          {/* DIRECTEUR */}
          <Route path="/directeur" element={
            <ProtectedRoute roles={["directeur"]}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard"    element={<DirecteurDashboard />} />
            <Route path="formateurs"   element={<DirecteurFormateurs />} />
            <Route path="surveillants" element={<DirecteurSurveillants />} />
            <Route path="groupes"      element={<DirecteurGroupes />} />
            <Route path="modules"      element={<DirecteurModules />} />
            <Route path="import"       element={<DirecteurImport />} />
            <Route path="alertes"     element={<DirecteurAlertes />} />
            <Route path="pole"        element={<DirecteurPole />} />


          </Route>

          {/* SURVEILLANT */}
          <Route path="/surveillant/dashboard" element={
            <ProtectedRoute roles={["surveillant"]}>
              <SurveillantDashboard />
            </ProtectedRoute>
          } />

          {/* FORMATEUR */}
          <Route path="/formateur/dashboard" element={
            <ProtectedRoute roles={["formateur"]}>
              <FormateurDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}