// components/CandidatureModal.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

export default function CandidatureModal({ isOpen, onClose, onSuccess }) {
  const [accepted, setAccepted] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const notifyAdmins = async () => {
  try {
    await api.post("/notifications/send", {
      message: `${res.data.user.nom} ${res.data.user.prenom} a postulé à la compétition`,
      targetRole: "ADMIN",
      userIds: [],
    });
  } catch (err) {
    console.error("Erreur notification candidature:", err);
  }
};

const handleSubmit = async () => {
  if (!accepted) return alert("Veuillez accepter les conditions !");
  if (!password) return alert("Veuillez confirmer avec votre mot de passe !");

  try {
    setLoading(true);
    // ✅ utiliser la bonne route et méthode PUT
    const res = await api.put("/candidatures/me/apply", { password });
    onSuccess(res.data.user); // renvoie l'user mis à jour
    alert("Votre candidature a été soumise avec succès !");
    onClose();

    // 🔔 Notification admins + agents
    await api.post("/notifications/send", {
      message: `Candidat ${res.data.user.nom} ${res.data.user.prenom} a postulé à la compétition`,
      targetRole: "ADMIN",
      userIds: [],
    });

    await api.post("/notifications/send", {
      message: `Candidat ${res.data.user.nom} ${res.data.user.prenom} a postulé à la compétition`,
      targetRole: "AGENT",
      userIds: [],
    });

  } catch (err) {
    console.error(err);
    alert(err.response?.data?.error || "Erreur lors de la postulation !");
  } finally {
    setLoading(false);
  }
};


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full h-[80vh] shadow-lg text-gray-800 flex flex-col"
          >
            <h2 className="text-xl font-bold mb-4 text-center text-blue-700">
              Postuler à la compétition
            </h2>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto mb-4">
              <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-700">
                <p>Avant de postuler, veuillez lire attentivement les conditions :</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Vous devez fournir des informations exactes.</li>
                  <li>Une fois la candidature soumise, elle sera évaluée par un agent.</li>
                  <li>Vous ne pourrez pas modifier vos données pendant le traitement.</li>
                  <li>Tout manquement peut entraîner un refus de candidature.</li>
                  <li>Et quelques conditions supplémentaires pour tester le scroll...</li>
                  <li>Encore une ligne de texte pour étendre le contenu</li>
                  <li>Et une dernière ligne de test</li>
                  <li>Vous devez fournir des informations exactes.</li>
                  <li>Une fois la candidature soumise, elle sera évaluée par un agent.</li>
                  <li>Vous ne pourrez pas modifier vos données pendant le traitement.</li>
                  <li>Tout manquement peut entraîner un refus de candidature.</li>
                  <li>Et quelques conditions supplémentaires pour tester le scroll...</li>
                  <li>Encore une ligne de texte pour étendre le contenu</li>
                  <li>Et une dernière ligne de test</li>
                </ul>
              </div>
            </div>

            {/* Case + champ mot de passe + boutons */}
            <div className="flex flex-col gap-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>J’accepte les conditions générales</span>
              </label>

              {accepted && (
                <input
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border rounded-lg w-full p-2 focus:ring focus:ring-blue-200 outline-none"
                />
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`px-4 py-2 rounded text-white ${
                    loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? "Envoi..." : "Valider"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
