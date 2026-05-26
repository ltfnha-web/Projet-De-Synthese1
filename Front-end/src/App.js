import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FilterProvider } from "./context/FilterContext";
import ProtectedRoute from "./components/ProtectedRoute";
import './styles/stylePole.css';

import Home                  from "./pages/Home";
import Login                 from "./pages/Login";
import EspaceStagiaire       from "./pages/EspaceStagiaire";
import AdminLayout           from "./components/admin/AdminLayout";
import DirecteurDashboard    from "./pages/directeur/Dashboard";
import DirecteurFormateurs   from "./pages/directeur/Formateurs";
import DirecteurGroupes      from "./pages/directeur/Groupes";
import DirecteurModules      from "./pages/directeur/Modules";
import DirecteurImport       from "./pages/directeur/ImportExcel";
import FormateurDashboard    from "./pages/formateur/Dashboard";
import DirecteurPole         from "./pages/directeur/Pole";
import DirecteurAlertes         from "./pages/directeur/Alertes";
import DirecteurUtilisateurs    from "./pages/directeur/Utilisateurs";
import DirecteurSuiviJournalier from "./pages/directeur/SuiviJournalier";
import MotDePasseOublie from "./pages/MotDePassOublie";
import ReinitialisationMotDePasse from "./pages/ReinitialisationMotDePasse";

// Rôle Pôle
import PoleLayout            from "./pages/pole/PoleLayout";
import Plannings             from "./pages/pole/Plannings";
import Emplois               from "./pages/pole/Emplois";
import PlanningStage         from "./pages/pole/PlanningStage";
import PoleAbsences          from "./pages/pole/Absences";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/home" replace />;
  const redirects = {
    directeur: "/directeur/dashboard",
    formateur: "/formateur/dashboard",
    stagiaire: "/stagiaire/espace",
    pole:      "/pole/plannings",
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
          <Route path="/mot-de-passe-oublie"           element={<MotDePasseOublie />} />
          <Route path="/reinitialisation-mot-de-passe" element={<ReinitialisationMotDePasse />} />
          <Route path="/"      element={<HomeRedirect />} />

          {/* Espace Stagiaire */}
          <Route path="/stagiaire/espace" element={
            <ProtectedRoute roles={["stagiaire"]}>
              <EspaceStagiaire />
            </ProtectedRoute>
          } />

          {/* DIRECTEUR */}
          <Route path="/directeur" element={
            <ProtectedRoute roles={["directeur"]}>
              <FilterProvider>
                <AdminLayout />
              </FilterProvider>
            </ProtectedRoute>
          }>
            <Route path="dashboard"    element={<DirecteurDashboard />} />
            <Route path="formateurs"   element={<DirecteurFormateurs />} />
            <Route path="groupes"      element={<DirecteurGroupes />} />
            <Route path="modules"      element={<DirecteurModules />} />
            <Route path="import"       element={<DirecteurImport />} />
            <Route path="alertes"      element={<DirecteurAlertes />} />
            <Route path="pole"         element={<DirecteurPole />} />
            <Route path="utilisateurs"    element={<DirecteurUtilisateurs />} />
            <Route path="suivi-journalier" element={<DirecteurSuiviJournalier />} />
          </Route>

          {/* FORMATEUR */}
          <Route path="/formateur/dashboard" element={
            <ProtectedRoute roles={["formateur"]}>
              <FormateurDashboard />
            </ProtectedRoute>
          } />

          {/* PÔLE */}
          <Route path="/pole" element={
            <ProtectedRoute roles={["pole"]}>
              <PoleLayout />
            </ProtectedRoute>
          }>
            <Route path="plannings"      element={<Plannings />} />
            <Route path="emplois"        element={<Emplois />} />
            <Route path="planning-stage" element={<PlanningStage />} />
            <Route path="absences"       element={<PoleAbsences />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}