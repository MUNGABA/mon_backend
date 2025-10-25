// src/pages/BannerManagement.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddBannerForm from "../components/AddBannerForm";
import BannerCarousel from "../components/BannerCarousel";
import Navbar from "../components/Navbar";
import api from "../services/api";

export default function BannerManagement() {
  const [banners, setBanners] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchBanners = async () => {
    try {
      const me = await api.get("/users/me");
      setUser(me.data);

      const res = await api.get("/banners");
      setBanners(res.data);
    } catch (err) {
      console.error("Erreur fetch banners:", err);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* ✅ Navbar */}
      <Navbar user={user} />

      <div className="flex flex-col items-center p-6 space-y-6 w-full">
        {/* ✅ Bouton retour */}
        <div className="w-full max-w-4xl flex justify-start">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded shadow"
          >
            ← Retour au Dashboard
          </button>
        </div>

        <h1 className="text-2xl font-bold">Gestion des Bannières</h1>

        {/* ✅ Formulaire d’ajout */}
        <AddBannerForm onUpdate={fetchBanners} />

        {/* ✅ Prévisualisation */}
        <div className="mt-6 w-full max-w-4xl">
          <h2 className="text-lg font-semibold mb-3">Prévisualisation</h2>
          <BannerCarousel banners={banners} interval={7000} />
        </div>
      </div>
    </div>
  );
}
