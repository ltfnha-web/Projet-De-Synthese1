import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * - Si non connecté  → redirige vers /login
 * - Si rôle incorrect → redirige vers /unauthorized
 * - Sinon → affiche la page
 *
 * Usage:
 *   <ProtectedRoute roles={["directeur"]}>
 *     <Dashboard />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth();

  // Attendre la vérification du token
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Non connecté
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Rôle non autorisé
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}