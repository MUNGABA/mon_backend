import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { Send, ArrowLeft } from "lucide-react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket"] });

export default function CandidateDetail({ user: propUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = propUser || location.state?.user || JSON.parse(localStorage.getItem("user") || "null");

  const [candidate, setCandidate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [pendingDecision, setPendingDecision] = useState(null);
  const messagesEndRef = useRef(null);

  // 🔹 Charger candidat et historique messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const candidateRes = await api.get(`/users/${id}`);
        setCandidate(candidateRes.data);

        const msgsRes = await api.get(`/messages-pro/${id}`);
        setMessages(msgsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 🔹 Connexion socket
  useEffect(() => {
    if (!candidate || !user) return;

    // Enregistrer utilisateur et rejoindre candidate room
    socket.emit("register", user.id);
    socket.emit("joinCandidate", candidate.id);

    // Créer la room de chat (agent/admin <-> candidat)
    const room = [user.id, candidate.id].sort().join("-");
    socket.emit("joinChat", { userId: user.id, friendId: candidate.id });

// --- Réception socket
const handleNewMessage = (incoming) => {
  if (!incoming) return;
  
  // Toujours convertir en tableau
  const arr = Array.isArray(incoming) ? incoming : [incoming];

  // Normaliser chaque message (éviter doublons + enrichir rôle si absent)
  setMessages((prev) => {
    const normalized = arr.map((m) => ({
      ...m,
      sender: m.sender || { id: m.senderId, role: m.senderRole || "CANDIDAT" },
    }));
    const uniques = normalized.filter((m) => !prev.some((p) => p.id === m.id));
    return [...prev, ...uniques];
  });
};
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [candidate, user]);

  // 🔹 Quand on ouvre une conversation, marquer les messages comme lus
useEffect(() => {
  const markAsSeen = async () => {
    if (!user || !candidate) return;
    try {
      await api.put("/messages-pro/seen", { friendId: candidate.id });
    } catch (err) {
      console.error("Erreur markAsSeenPro:", err);
    }
  };

  // On marque comme lu uniquement pour les rôles STAFF (agent/admin)
  if (["ADMIN", "AGENT"].includes(user.role)) {
    markAsSeen();
  }
}, [candidate, user]);

  // 🔹 Scroll auto
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


// --- Envoi message
const handleSendMessage = async () => {
  if (!newMessage.trim()) return;
  try {
    const res = await api.post("/messages-pro", {
      receiverId: candidate.id,
      content: newMessage,
    });

    // Convertir en tableau
    const sentArray = Array.isArray(res.data) ? res.data : [res.data];

    // enrichir chaque message localement
    const enriched = sentArray.map((m) => ({
      ...m,
      senderId: user.id,
      sender: { id: user.id, role: user.role },
    }));

    // N’ajouter qu’un seul message (le premier) pour éviter duplication
    setMessages((prev) => [...prev, enriched[0]]);
    setNewMessage("");
    socket.emit("sendMessage", {
      ...enriched[0],
      senderRole: "CANDIDAT", // ajouter explicitement
    });
    
  } catch (err) {
    console.error(err);
    alert("Erreur lors de l'envoi du message");
  }
};

  // 🔹 Gestion décision (ACCEPTE/REFUSE/ANNULER)
  const handleDecision = async () => {
    if (!password || !pendingDecision) return alert("Veuillez entrer votre mot de passe");
    try {
      setDecisionLoading(true);
      const route =
        pendingDecision === "ANNULER"
          ? `/candidatures/admin/${id}/cancel`
          : `/candidatures/${user.role === "ADMIN" ? "admin" : "agent"}/${id}/decision`;

      const body = { password };
      if (pendingDecision !== "ANNULER") body.decision = pendingDecision;

      await api.put(route, body);

      const res = await api.get(`/users/${id}`);
      setCandidate(res.data);
      setShowPasswordModal(false);
      setPassword("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Erreur de validation");
    } finally {
      setDecisionLoading(false);
    }
  };

  if (!candidate) return <div className="flex items-center justify-center h-screen text-gray-500">Chargement...</div>;

  const statut = candidate?.candidatureStatus || "EN_ATTENTE";
  const badgeColor =
    statut === "ACCEPTE"
      ? "bg-green-200 text-green-800"
      : statut === "REFUSE"
      ? "bg-red-200 text-red-800"
      : "bg-gray-200 text-gray-700";

  const getPhotoUrl = (photo) =>
    photo ? `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${photo}` : "/default-avatar.png";

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      {/* HEADER */}
      <div className="flex items-center justify-between bg-blue-900/90 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white hover:text-cyan-400 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-400">
            <img src={getPhotoUrl(candidate.photo)} alt={candidate.nom} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <p className="text-white font-semibold">{candidate.nom} {candidate.postnom} {candidate.prenom}</p>
            <span className={`text-xs px-2 py-1 rounded-full ${badgeColor} font-medium mt-1`}>{statut}</span>
          </div>
        </div>

        {/* Boutons décision */}
        <div className="flex gap-2">
          {(user.role === "AGENT" || user.role === "ADMIN") && statut === "EN_ATTENTE" && (
            <>
              <button onClick={() => { setPendingDecision("ACCEPTE"); setShowPasswordModal(true); }}
                      className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-700 transition shadow-md">✅</button>
              <button onClick={() => { setPendingDecision("REFUSE"); setShowPasswordModal(true); }}
                      className="bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-700 transition shadow-md">❌</button>
            </>
          )}
          {user.role === "ADMIN" && (statut === "ACCEPTE" || statut === "REFUSE") && (
            <button onClick={() => { setPendingDecision("ANNULER"); setShowPasswordModal(true); }}
                    className="bg-gray-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-600 transition shadow-md">🔁</button>
          )}
        </div>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-200">
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-gray-400 mt-10 text-sm"
                >
                  Commencez la conversation en envoyant un message.
                </motion.p>
              ) : (
                messages.map((msg) => {
                  const senderRole = msg.sender?.role;
                  const isUserCandidate = user.role === "CANDIDAT";
                  const isUserStaff = user.role === "AGENT" || user.role === "ADMIN";

                  // Déterminer l'alignement selon le rôle et le point de vue
                  let alignRight = false;

                  if (isUserCandidate) {
                    // 👤 Candidat → ses messages à droite
                    alignRight = msg.senderId === user.id;
                  } else if (isUserStaff) {
                    // 🧑‍💼 Staff → leurs messages à droite
                    alignRight = senderRole === "AGENT" || senderRole === "ADMIN";
                  }

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex ${alignRight ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex flex-col max-w-[70%] px-4 py-2 rounded-2xl shadow-md break-words ${
                          alignRight
                            ? "bg-cyan-600 text-white rounded-br-none"
                            : "bg-gray-200 text-gray-900 rounded-bl-none"
                        }`}
                      >
                        <p className="text-[15px] leading-snug">{msg.content}</p>
                        <span
                          className={`text-[10px] mt-1 ${
                            alignRight ? "text-gray-200 text-right" : "text-gray-500 text-left"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="bg-white p-3 flex items-center gap-2 shadow-lg">
        <input
          type="text"
          placeholder="Écrire un message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 border rounded-full px-4 py-2 focus:ring-2 focus:ring-cyan-400 transition"
        />
        <button onClick={handleSendMessage} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 transition">
          <Send size={18} />
        </button>
      </div>

      {/* MODAL mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-80">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 text-center">Confirmer l’action</h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Entrez votre mot de passe pour <strong>{pendingDecision === "ACCEPTE" ? "accepter" : pendingDecision === "REFUSE" ? "refuser" : "annuler la décision"}</strong> cette candidature.
            </p>
            <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} className="border rounded-full w-full p-2 mb-4 focus:ring-2 focus:ring-cyan-400 transition"/>
            <div className="flex justify-between">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 transition">Annuler</button>
              <button onClick={handleDecision} disabled={decisionLoading} className="px-4 py-2 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 transition">{decisionLoading ? "..." : "Confirmer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
