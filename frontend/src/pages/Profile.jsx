import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  // --- Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Erreur fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // --- Gestion upload photo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else setPreview(null);
  };

  const handleSavePhoto = async () => {
    if (!selectedFile) return alert("Veuillez sélectionner une photo !");
    try {
      const formData = new FormData();
      formData.append("image", selectedFile); // ✅ doit correspondre au backend

      const uploadRes = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cloudUrl = uploadRes.data.url;

      const updateRes = await api.put("/users/me/photo", { photoUrl: cloudUrl });
      setUser(updateRes.data);
      setPreview(updateRes.data.photoUrl);
      setSelectedFile(null);

      alert("Photo mise à jour !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour !");
    }
  };

  // --- Gestion Cloudinary / avatar par défaut
  const getPhotoUrl = (photo) => {
    if (!photo) return "/default-avatar.png";
    if (photo.startsWith("http") && photo.includes("res.cloudinary.com")) {
      const url = new URL(photo);
      const parts = url.pathname.split("/upload/");
      if (parts.length === 2) {
        return `${parts[0]}/upload/c_fill,w_200,h_200,f_auto,q_auto/${parts[1]}`;
      }
    }
    return photo.startsWith("http") ? photo : `${import.meta.env.VITE_API_URL.replace("/api","")}/uploads/${photo}`;
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
        <h2 className="text-2xl font-bold mb-4">Mon Profil</h2>

        {/* Avatar */}
        <motion.img
          layoutId="profile-photo"
          src={preview || getPhotoUrl(user.photoUrl)}
          alt="avatar"
          className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border cursor-pointer"
          onClick={() => setShowPopup(true)}
        />

        {/* Upload */}
        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
          {user?.photoUrl ? "Changer la photo" : "Ajouter une photo"}
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
        <h2 className="text-xl font-bold mt-4">{user.nom} {user.postnom} {user.prenom}</h2>

        {/* Infos */}
        <div className="mt-4 text-left space-y-2">
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Téléphone :</strong> {user.tel || "Non renseigné"}</p>
          <p><strong>Adresse :</strong> {user.adresse || "Non renseignée"}</p>
          <p><strong>Date de naissance :</strong> {user.dateNaissance || "Non renseignée"}</p>
        </div>
      </div>

      {/* Pop-up photo */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowPopup(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.img
              layoutId="profile-photo"
              src={preview || getPhotoUrl(user.photoUrl)}
              alt="avatar"
              className="max-w-lg max-h-[80%] rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-red-700"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
