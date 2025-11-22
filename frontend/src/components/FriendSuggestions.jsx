import React, { useEffect, useState } from "react";
import api from "../services/api";
import { UserPlus, X, Check, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function FriendSuggestions({ searchTerm = "" }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/friendships/suggestions");
      const shuffled = res.data.sort(() => Math.random() - 0.5).slice(0, 15);
      setSuggestions(shuffled);
    } catch (err) {
      console.error("Erreur suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const filteredSuggestions = suggestions.filter((u) => {
    const fullName = `${u.nom || ""} ${u.prenom || ""} ${u.postnom || ""}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const getPhotoUrl = (photo) => {
  if (!photo) return "/default-avatar.png";
  return optimizeImage(photo, 400);    // <-- URL Cloudinary directe
};

  const handleSendRequest = async (receiverId) => {
    try {
      const res = await api.post("/friendships/send", { receiverId });
      toast.success("Demande envoyée !");
      setSuggestions((prev) =>
        prev.map((u) =>
          u.id === receiverId
            ? { ...u, hasPendingRequest: true, friendshipId: res.data.id }
            : u
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur !");
    }
  };

  const handleCancelRequest = async (friendshipId) => {
    try {
      await api.post("/friendships/cancel", { friendshipId });
      toast("Demande annulée");
      setSuggestions((prev) =>
        prev.map((u) =>
          u.friendshipId === friendshipId
            ? { ...u, hasPendingRequest: false, friendshipId: null }
            : u
        )
      );
    } catch (err) {
      toast.error("Erreur lors de l’annulation !");
    }
  };

  const handleAccept = async (friendshipId) => {
    try {
      await api.post("/friendships/respond", { friendshipId, response: "ACCEPTED" });
      toast.success("Demande acceptée !");
      setSuggestions((prev) =>
        prev.map((s) =>
          s.friendshipId === friendshipId ? { ...s, justAccepted: true } : s
        )
      );
    } catch (err) {
      toast.error("Erreur !");
    }
  };

  const handleReject = async (friendshipId) => {
    try {
      await api.post("/friendships/respond", { friendshipId, response: "REFUSED" });
      toast("Demande refusée");
      setSuggestions((prev) => prev.filter((u) => u.friendshipId !== friendshipId));
    } catch (err) {
      toast.error("Erreur !");
    }
  };

  if (loading)
    return <p className="text-center text-gray-400">Chargement des suggestions...</p>;

  return (
    <div className="relative w-full py-3 px-2">
  {/* Barre de scroll horizontale */}
  <div className="flex overflow-x-auto no-scrollbar gap-3 snap-x snap-mandatory px-3">
    {filteredSuggestions.map((u) => (
      <motion.div
        key={u.id}
        className="snap-start w-32 md:w-36 bg-white rounded-3xl shadow-lg flex-shrink-0 flex flex-col cursor-pointer hover:scale-105 hover:shadow-2xl transition-all duration-300"
      >
        {/* Photo avec overlay */}
        <div className="relative w-full h-36 group">
          <img
            src={getPhotoUrl(u.photo)}
            alt={`${u.nom} ${u.prenom}`}
            className="w-full h-full object-cover rounded-t-3xl"
            onClick={() => setSelectedPhoto(getPhotoUrl(u.photo))}
          />
          <div className="absolute bottom-0 w-full bg-black/25 backdrop-blur-sm p-1 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity">
            <h3 className="text-white font-semibold text-xs truncate text-center">
              {u.nom} {u.prenom}
            </h3>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-1 p-2">
          {u.hasSentRequestToMe ? (
            u.justAccepted ? (
              <button className="w-full bg-green-600/80 text-white py-1 rounded-2xl text-xs cursor-default">
                ✅ Accepté
              </button>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => handleAccept(u.friendshipId)}
                  className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-1 rounded-2xl flex items-center justify-center gap-1 text-xs transition transform hover:scale-105"
                >
                  <Check size={12} /> Accepter
                </button>
                <button
                  onClick={() => handleReject(u.friendshipId)}
                  className="w-full bg-gradient-to-r from-red-400 to-red-600 text-white py-1 rounded-2xl flex items-center justify-center gap-1 text-xs transition transform hover:scale-105"
                >
                  <X size={12} /> Refuser
                </button>
              </div>
            )
          ) : u.hasPendingRequest ? (
            <button
              onClick={() => handleCancelRequest(u.friendshipId)}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-1 rounded-2xl flex items-center justify-center gap-1 text-xs transition transform hover:scale-105"
            >
              <XCircle size={12} /> Annuler
            </button>
          ) : (
            <button
              onClick={() => handleSendRequest(u.id)}
              className="w-full bg-gradient-to-r from-cyan-400 to-cyan-600 text-white py-1 rounded-2xl flex items-center justify-center gap-1 text-xs transition transform hover:scale-105"
            >
              <UserPlus size={12} /> Ajouter
            </button>
          )}
        </div>
      </motion.div>
    ))}
  </div>

  {/* Zoom photo */}
  <AnimatePresence>
    {selectedPhoto && (
      <motion.div
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        onClick={() => setSelectedPhoto(null)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedPhoto(optimizeImage(u.photo, 1200))}
            className="absolute top-3 right-3 bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-700 transition"
          >
            ✕
          </button>
          <motion.img
            src={selectedPhoto}
            alt="photo zoom"
            className="max-w-lg max-h-[80vh] rounded-3xl shadow-2xl"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          />
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>

  );
}
