import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api"; // ton axios configuré vers le backend

// Création du contexte
const AuthContext = createContext();

// Fournisseur global du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Charger les infos du user depuis le localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  // 🔹 Connexion utilisateur
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      // Stockage local
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Configuration axios pour les prochaines requêtes
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setUser(user);
      return user;
    } catch (err) {
      console.error("Erreur login:", err);
      throw err;
    }
  };

  // 🔹 Déconnexion
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  // 🔹 Vérifie si un utilisateur est connecté
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isAuthenticated,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook pratique pour accéder au contexte
export const useAuth = () => useContext(AuthContext);
