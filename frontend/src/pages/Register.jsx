// FILE: src/pages/Register.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FiUser, FiMail, FiLock, FiPhone, FiHome } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";


export default function Register() {
  const [form, setForm] = useState({
    nom: "",
    postnom: "",
    prenom: "",
    tel: "",
    adresse: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 🔹 Création du compte
      const { data } = await api.post("/auth/register", form);

      // 🔹 Connexion automatique (si ton endpoint register ne renvoie pas token, sinon inutile)
      const loginRes = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      // 🔹 Sauvegarde du token et infos user
      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("user", JSON.stringify(loginRes.data.user));

       setMessage("Votre compte a été créé avec succès !");
      // 🔹 Redirection selon rôle
      setTimeout(() => {
      if (loginRes.data.user.role === "ADMIN") navigate("/admin");
      else if (loginRes.data.user.role === "AGENT") navigate("/agent");
      else navigate("/dashboard");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'inscription");
    }
  };

  return (
    
    <div
      className="min-h-screen w-full flex items-center bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/register.jpg')" }}
    >
      
      <div className="absolute inset-0 bg-black/60"></div>

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
        <h3 className="text-sm tracking-wide text-gray-300">COMMENCER MAINTENANT</h3>
        <h1 className="text-3xl font-bold mt-2">
          Crée votre compte<span className="text-blue-500">.</span>
        </h1>

        <p className="text-gray-300 mt-2 text-sm">
          Avez-vous déjà un compte ?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-500">
            Se connecter
          </Link>
        </p>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-white">
          <div className="flex gap-4">
            <div className="relative w-1/2">
              <FiUser className="absolute top-3 left-3 text-gray-400" />
              <input
                name="nom"
                placeholder="Nom"
                onChange={handleChange}
                className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div className="relative w-1/2">
              <FiUser className="absolute top-3 left-3 text-gray-400" />
              <input
                name="postnom"
                placeholder="Postnom"
                onChange={handleChange}
                className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="relative">
            <FiUser className="absolute top-3 left-3 text-gray-400" />
            <input
              name="prenom"
              placeholder="Prénom"
              onChange={handleChange}
              className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="relative">
            <FiPhone className="absolute top-3 left-3 text-gray-400" />
            <input
              name="tel"
              placeholder="Téléphone"
              onChange={handleChange}
              className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="relative">
            <FiHome className="absolute top-3 left-3 text-gray-400" />
            <input
              name="adresse"
              placeholder="Adresse: commune, quartier..."
              onChange={handleChange}
              className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="relative">
            <FiMail className="absolute top-3 left-3 text-gray-400" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div className="relative">
            <FiLock className="absolute top-3 left-3 text-gray-400" />
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              onChange={handleChange}
              className="w-full pl-10 bg-[#0f172a]/60 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
       {message && <p className="text-green-500 mt-4">{message}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold"
          >
            Crée le compte
          </button>
        </form>
      </div>
    </div>
  );
}
