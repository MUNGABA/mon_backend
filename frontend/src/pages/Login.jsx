// FILE: src/pages/Login.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { FiMail, FiLock } from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { email, password });

      localStorage.clear();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "ADMIN") navigate("/admin");
      else if (data.user.role === "AGENT") navigate("/agent");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/register.jpg')" }}
    >
      
      
      <div className="relative z-10 w-full max-w-xl ml-20 bg-[#1e293b]/0 backdrop-blur-md p-10 rounded-2xl shadow-xl text-white">
       {/* 🔹 Home en haut à droite */}
        <div className="absolute top-4 right-4">
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-500 font-semibold"
          >
            Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold">Bienvenue 👋</h1>
        <p className="text-gray-300 mt-2 text-sm">
          Connectez-vous pour continuer votre aventure biblique.
        </p>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <form onSubmit={handleLogin} className="mt-8 space-y-4 text-white">
          <div className="relative">
            <FiMail className="absolute top-3 left-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="relative">
            <FiLock className="absolute top-3 left-3 text-gray-400" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
          >
            Se connecter
          </button>
        </form>

        <p className="text-sm text-gray-300 mt-4">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-500">
            Créez-en un ici
          </Link>
        </p>
      </div>
    </div>
  );
}
