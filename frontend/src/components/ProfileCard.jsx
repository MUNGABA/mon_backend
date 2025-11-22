// src/components/ProfileCard.jsx
import { useState } from "react";
import api from "../services/api";

export default function ProfileCard({ user }) {
  const [name, setName] = useState(user?.name || "");
  const [photo, setPhoto] = useState(null); // fichier local sélectionné
  const [preview, setPreview] = useState(user?.photo || null); // URL Cloudinary ou preview local

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file)); // preview avant upload
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (photo) formData.append("photo", photo); // upload fichier vers Cloudinary via backend

      const res = await api.put("/users/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Profil mis à jour !");
      setPhoto(null);
      setPreview(res.data.photo || preview); // mettre à jour l’URL Cloudinary renvoyée
    } catch (err) {
      console.error("Erreur update profil:", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <div className="bg-white shadow-md rounded p-4">
      <h2 className="text-lg font-bold mb-3">Mon Profil</h2>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 border rounded mb-3"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="mb-3"
      />

      {preview && (
        <img
          src={preview}
          alt="Aperçu"
          className="w-24 h-24 rounded-full object-cover mb-3"
        />
      )}

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Sauvegarder
      </button>
    </div>
  );
}
