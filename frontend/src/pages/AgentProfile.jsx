// src/pages/AgentProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AgentProfile() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Erreur fetch agent profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return alert("Veuillez d’abord sélectionner une photo !");
    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const res = await api.put("/users/me/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(res.data);
      setSelectedFile(null);
      setPreview(res.data.photoUrl);

      alert("Photo mise à jour !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour !");
    }
  };

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Retour
      </button>

      <div className="bg-white shadow p-6 rounded max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Mon Profil (Agent)</h2>

        {/* Avatar */}
        <img
          src={preview || user?.photoUrl || "/default-avatar.png"}
          alt="agent avatar"
          className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border"
        />

        {/* Upload */}
        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
          {user?.photoUrl ? "Changer la photo" : "Ajouter une photo"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {selectedFile && (
          <button
            onClick={handleSavePhoto}
            className="block mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mx-auto"
          >
            Sauvegarder
          </button>
        )}

        {/* Nom complet */}
        <h2 className="text-xl font-bold mt-4">
          {user.nom} {user.postnom} {user.prenom}
        </h2>

        {/* Autres infos de l’agent */}
        <div className="mt-4 text-left space-y-2">
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Téléphone :</strong> {user.telephone || "Non renseigné"}</p>
          <p><strong>Adresse :</strong> {user.adresse || "Non renseignée"}</p>
        </div>
      </div>
    </div>
  );
}
