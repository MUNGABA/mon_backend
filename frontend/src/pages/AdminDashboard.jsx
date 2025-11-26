import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import UserList from "../components/UserList";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";

export default function AdminDashboard({ user: propUser }) {
  const [user, setUser] = useState(propUser);
  const [candidates, setCandidates] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const me = await api.get("/users/me");
        setUser(me.data);

        const users = await api.get("/admin/users/candidats");
        setCandidates(users.data);
      } catch (err) {
        console.error("Erreur fetch admin dashboard:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
  if (!selectedFile) return alert("Veuillez sélectionner une photo !");

  try {
    // 1) Upload vers Cloudinary via ton backend
    const formData = new FormData();
    formData.append("image", selectedFile);

    const uploadRes = await api.post("/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const cloudUrl = uploadRes.data.url;

    // 2) Mise à jour du user avec l'URL Cloudinary
    const updateRes = await api.put("/users/me/photo", {
      photoUrl: cloudUrl,
    });

    setUser(updateRes.data);
    setSelectedFile(null);
    setPreview(updateRes.data.photoUrl);

    alert("Photo mise à jour !");
  } catch (err) {
    console.error("Erreur upload photo:", err);
    alert("Erreur lors de la mise à jour !");
  }
};



  const showLeft = showLeftSidebar || windowWidth >= 768;
  const showRight = showRightSidebar || windowWidth >= 1024;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-gray-100">
      {/* Navbar */}
      <Navbar user={user} theme="dark" />

      {/* Boutons mobiles */}
      {windowWidth < 768 && (
        <div className="flex justify-between bg-blue-900/80 backdrop-blur-md text-white p-2 shadow-md">
          <button
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 transition-all"
            onClick={() => setShowLeftSidebar(true)}
          >
            <Menu size={18} /> Profil
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-cyan-500 hover:to-blue-600 transition-all"
            onClick={() => setShowRightSidebar(true)}
          >
            <Menu size={18} /> Outils
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR GAUCHE : Profil */}
        <AnimatePresence>
          {showLeft && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3 }}
              className="w-64 bg-blue-900/60 backdrop-blur-md border-r border-blue-700/40 shadow-lg h-screen overflow-y-auto fixed md:relative z-40 p-4"
            >
              {windowWidth < 768 && (
                <button
                  className="mb-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 ml-auto block"
                  onClick={() => setShowLeftSidebar(false)}
                >
                  ✕
                </button>
              )}
              <h2 className="text-lg font-bold mb-4 text-cyan-400 text-center">
                Mon Profil (Admin)
              </h2>
              <motion.img
                  layoutId="admin-photo"
                  src={preview || user?.photoUrl || "/default-avatar.png"}
                  alt="admin avatar"
                  className="w-24 h-24 rounded-full mx-auto mb-3 border-2 border-cyan-500 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setShowPopup(true)}
                />
              <div className="flex flex-col items-center">
                <label className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-3 py-1 rounded cursor-pointer hover:from-cyan-500 hover:to-blue-600 text-sm mb-2">
                  Changer la photo
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
                    className="bg-green-500/80 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Sauvegarder
                  </button>
                )}
              </div>
              <div className="mt-4 text-center text-sm text-gray-200 space-y-1">
                <p className="font-semibold text-cyan-300">
                  {user?.nom} {user?.postnom} {user?.prenom}
                </p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Téléphone:</strong> {user?.telephone || "—"}</p>
                <p><strong>Adresse:</strong> {user?.adresse || "—"}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENU CENTRAL */}
        <div className="flex-1 bg-blue-800/30 backdrop-blur-md rounded-none p-4 overflow-y-auto mx-auto max-w-6xl shadow-inner border border-blue-700/30">
          <UserList
            users={candidates}
            user={user}      // <-- IMPORTANT
            isAgent={false}
            isAdmin={true}
          />

        </div>

        {/* SIDEBAR DROITE : Outils */}
        <AnimatePresence>
          {showRight && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ duration: 0.3 }}
              className="w-64 bg-blue-900/60 backdrop-blur-md border-l border-blue-700/40 shadow-lg h-screen overflow-y-auto fixed right-0 md:relative z-40 p-4"
            >
              {windowWidth < 1024 && (
                <button
                  className="mb-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 ml-auto block"
                  onClick={() => setShowRightSidebar(false)}
                >
                  ✕
                </button>
              )}
              <h2 className="text-lg font-bold mb-4 text-cyan-400 text-center">
                Outils Admin
              </h2>
              <button
                onClick={() => navigate("/admin/banners")}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 mb-2 transition-all"
              >
                📸 Gestion des bannières
              </button>
              <button
                onClick={() => navigate("/admin/notifications")}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-2 transition-all"
              >
                🔔 Gestion des notifications
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-2 transition-all"
              >
                👥 Gestion des utilisateurs
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* POPUP PHOTO */}
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
              layoutId="admin-photo"
              src={preview || user?.photoUrl || "/default-avatar.png"}
              alt="photo admin"
              className="max-w-lg max-h-[80%] rounded-lg shadow-lg border border-cyan-400"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
