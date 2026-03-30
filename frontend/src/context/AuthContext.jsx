import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

// URL de l'API Laravel
axios.defaults.baseURL = "http://localhost:8000/api";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement : vérifier si un token existe déjà
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.get("/me")
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem("token");
          delete axios.defaults.headers.common["Authorization"];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Connexion
  const login = async (email, password) => {
    const res = await axios.post("/login", { email, password });
    const { token, user } = res.data;

    localStorage.setItem("token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(user);

    return user; // retourner l'user pour redirection dans le composant
  };

  // Déconnexion
  const logout = async () => {
    await axios.post("/logout").catch(() => {});
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook custom
export function useAuth() {
  return useContext(AuthContext);
}