// src/components/AddBannerForm.jsx
import { useState, useEffect } from "react";
import api from "../services/api";

export default function AddBannerForm({ onUpdate }) {
  const [files, setFiles] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await api.get("/banners");
      setBanners(res.data);
    } catch (err) {
      console.error("Erreur récupération bannières:", err);
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Veuillez sélectionner des images.");
    setLoading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("banners", file));

      await api.post("/banners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFiles([]);
      fetchBanners();
      if (onUpdate) onUpdate();
      alert("✅ Bannières ajoutées avec succès !");
    } catch (err) {
      console.error("Erreur upload:", err);
      alert("❌ Erreur lors de l’upload.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette bannière ?")) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert("❌ Erreur suppression.");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 shadow">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">
        Gestion des bannières
      </h3>

      {/* ✅ Bouton "Choisir" stylé au lieu d’un input brut */}
      <label className="bg-gray-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-700 inline-block mb-2">
        Choisir des images
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      <button
        onClick={handleUpload}
        disabled={loading || files.length === 0}
        className="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Uploader"}
      </button>

      {/* Liste des bannières */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {banners.map((b) => (
          <div key={b.id} className="relative group">
            <img
              src={`${import.meta.env.VITE_SOCKET_URL}/uploads/banners/${b.image}`}
              alt="banner"
              className="w-full h-24 object-cover rounded shadow"
            />
            <button
              onClick={() => handleDelete(b.id)}
              className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
