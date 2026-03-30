import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DirecteurDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>

      <h1>✅ Directeur connecté !</h1>
      <p>Bienvenue, <strong>{user?.name}</strong></p>

      <button onClick={handleLogout} style={{ marginTop: "20px", padding: "10px 20px" }}>
        Se déconnecter
      </button>

    </div>
  );
}