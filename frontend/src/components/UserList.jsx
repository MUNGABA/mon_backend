import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";


const socket = io(import.meta.env.VITE_SOCKET_URL);

export default function UserList({ isAdmin, isAgent, users, user }) {
  const [query, setQuery] = useState("");
  const [userList, setUserList] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const navigate = useNavigate();

  // 🔹 Charger les utilisateurs depuis l’API admin/agent uniquement si pas fourni via props
  useEffect(() => {
  if (users && users.length > 0) {
    // Si les users sont déjà passés en props
    // 🔹 On s’assure que chaque candidat a assignedAgentId et assignedAgent
    const mappedUsers = users.map(u => ({
  ...u,
  assignedAgentId: u.assignedAgent?.id || null,
  assignedAgent: u.assignedAgent || { id: null, nom: "—" },
  }));

    setUserList(mappedUsers);
  } else {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/candidats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (!res.ok) throw new Error("Erreur lors du chargement des utilisateurs");
        const data = await res.json();

        // 🔹 On map directement les candidats pour avoir assignedAgentId et assignedAgent
        const mappedData = data.map(u => ({
          ...u,
          assignedAgentId: u.assignedAgent?.id || null,
          assignedAgent: u.assignedAgent || { id: null, nom: "—" },
        }));

        setUserList(mappedData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUsers();
  }
}, [users]);

  // 🔹 Réception temps réel (socket)
  useEffect(() => {
    socket.on("newCandidature", (newUser) => {
      setUserList((prev) => [newUser, ...prev]);
    });

    return () => socket.off("newCandidature");
    
  }, []);

  // 🔹 Rejoindre la room selon rôle et room perso pour messages en temps réel
useEffect(() => {
  if (!user?.id || !user?.role) return;

  // 🔹 Rejoindre la room perso
  socket.emit("register", user.id);

  // 🔹 Rejoindre la room du rôle
  socket.emit("joinRole", user.role);

  console.log(`🟢 Socket connecté pour user ${user.id} avec rôle ${user.role}`);

  // 🔹 Réception des compteurs en temps réel
  const handleUnread = (countsMap) => {
    setUnreadCounts(countsMap);
  };

  socket.on("unreadCountUpdated", handleUnread);

  return () => {
    socket.off("unreadCountUpdated", handleUnread);
  };
}, [user]);

useEffect(() => {
  const handler = ({ candidateId, assignedAgent }) => {
    setUserList(prev =>
      prev.map(u =>
        u.id === candidateId ? { ...u, assignedAgentId: assignedAgent.id, assignedAgent } : u
      )
    );
  };

  socket.on("candidateAssigned", handler);
  return () => socket.off("candidateAssigned", handler);
}, []);

useEffect(() => {
  const fetchLastMessages = async () => {
    try {
      const res = await api.get("/messages-pro/last"); // route du contrôleur pro
      setLastMessages(res.data);
    } catch (err) {
      console.error("Erreur chargement lastMessages:", err);
    }
  };

  fetchLastMessages();
}, []);


  // 🔹 Confirmation action admin
  const handleConfirm = async () => {
    if (!confirmAction) return;
    setLoading(true);
    setMessage("");

    try {
      const adminEmail = localStorage.getItem("adminEmail");
      if (!adminEmail) throw new Error("Admin non connecté");

      const payload = { userId: confirmAction.user.id, password, adminEmail };
      if (confirmAction.type === "promote") payload.role = confirmAction.role;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/${confirmAction.type}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");

      toast.success("✅ Action réussie !");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      toast.error("❌ " + err.message);
    } finally {
      setLoading(false);
      setPassword("");
    }
  };

  // ✅ Fonction d’assignation
const handleAssign = async (candidateId) => {
  try {
    if (!password) return setMessage("⚠️ Entrez votre mot de passe.");
    setLoading(true);
    setMessage("");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/assign/assign-candidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ candidateId, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur d’assignation");

    // 🔹 Fermer le modal d’assignation immédiatement
    setConfirmAction(null);

    // 🔹 Mise à jour locale immédiate
    setUserList(prev =>
      prev.map(item =>
        item.id === candidateId
          ? { ...item, assignedAgentId: user.id, assignedAgent: { id: user.id, nom: user.nom } }
          : item
      )
    );

    // 🔹 Émettre socket
    socket.emit("candidateAssigned", { candidateId, assignedAgent: { id: user.id, nom: user.nom } });

    setMessage("✅ Candidat assigné avec succès !");
    setPassword("");
  } catch (err) {
    setMessage("❌ " + err.message);
  } finally {
    setLoading(false);
  }
};

  // 🔹 Déterminer la liste à utiliser
  const usersSource = userList.length > 0 ? userList : users || [];

 // 🔹 Filtrer les candidats
const filteredUsers = userList.filter((u) =>
  `${u.nom} ${u.postnom} ${u.prenom}`.toLowerCase().includes(query.toLowerCase())
);

// 🧠 Trier par activité
const sortedUsers = [...filteredUsers].sort((a, b) => {
  const unreadA = unreadCounts[a.id] || 0;
  const unreadB = unreadCounts[b.id] || 0;
  const lastA = lastMessages[a.id]?.createdAt
    ? new Date(lastMessages[a.id].createdAt).getTime()
    : 0;
  const lastB = lastMessages[b.id]?.createdAt
    ? new Date(lastMessages[b.id].createdAt).getTime()
    : 0;
  const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
  const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
  const scoreA = unreadA * 1000 + lastA + createdA;
  const scoreB = unreadB * 1000 + lastB + createdB;
  return scoreB - scoreA;
});


  // 🔹 Compter les candidatures en attente pour badge
  const pendingCount = usersSource.filter((u) => u.candidatureStatus === "EN_ATTENTE").length;

    useEffect(() => {
        const handleEsc = (e) => e.key === "Escape" && setSelectedPhoto(null);
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
      }, []);

    // Charger les compteurs initiaux
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/messages-pro/unread/counts");
        setUnreadCounts(res.data);
      } catch (err) {
        console.error("Erreur chargement non lus", err);
      }
    };
    fetchUnread();
  }, []);

// Écoute en temps réel
useEffect(() => {
  const handleNewMessage = async (msg) => {
    console.log("📩 Nouveau message reçu côté staff:", msg);

    // Vérifie si le message vient d’un candidat connu
    const isFromCandidate = userList.some(u => u.id === msg.senderId);

    // 🔹 On ignore les messages qui ne viennent pas d’un candidat
    if (!isFromCandidate) return;

    // 🔹 Si c’est un admin → voit tous les messages candidats
    if (isAdmin) {
      setUnreadCounts((prev) => ({
        ...prev,
        [msg.senderId]: (prev[msg.senderId] || 0) + 1,
      }));
    }

    // 🔹 Si c’est un agent → voir si le candidat est assigné à lui
    if (isAgent) {
      try {
        const res = await api.get(`/candidats/${msg.senderId}/assigned`);
        const { assignedAgentId } = res.data;

        if (!assignedAgentId || Number(assignedAgentId) === Number(user.id)) {
          setUnreadCounts((prev) => ({
            ...prev,
            [msg.senderId]: (prev[msg.senderId] || 0) + 1,
          }));
        }
      } catch (err) {
        console.error("Erreur vérif assignation message:", err);
      }
    }
  };

  const handleMessagesRead = ({ candidateId }) => {
    setUnreadCounts((prev) => ({ ...prev, [candidateId]: 0 }));
  };

  socket.on("newMessage", handleNewMessage);
  socket.on("messagesRead", handleMessagesRead);

  return () => {
    socket.off("newMessage", handleNewMessage);
    socket.off("messagesRead", handleMessagesRead);
  };
}, [user, isAdmin, isAgent, userList]);

  const handleOpenCandidate = (candidate) => {
  setUnreadCounts((prev) => ({ ...prev, [candidate.id]: 0 }));
  socket.emit("markAsRead", { candidateId: candidate.id });
  navigate(`/candidats/${candidate.id}`);
};



  return (
    <div className="bg-gray-900 text-gray-100 shadow-xl rounded-2xl p-6 w-full h-full">

      {/* 🔍 Barre de recherche + badge */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center">
          Liste des candidats
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-600 text-white rounded-full px-2 text-xs">
              {pendingCount}
            </span>
          )}
        </h3>
        <input
          type="text"
          placeholder="Rechercher un candidat..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-gray-100 placeholder-gray-400"
        />
      </div>

      {/* 🧾 Liste des utilisateurs */}
      <div
          className="space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-gray-800 rounded-xl"
          style={{
            scrollBehavior: "smooth",
            maxHeight: "calc(100vh - 180px)",
          }}
        >
        {filteredUsers.length === 0 && (
          <p className="text-gray-400 text-sm">Aucun résultat trouvé.</p>
        )}

          {sortedUsers.map((u) => {
          const updatedUser = userList.find(usr => usr.id === u.id) || u;
          const isAssigned = !!u.assignedAgentId;
          const isMyCandidate = Number(u.assignedAgentId) === Number(user?.id);

            return (
              <motion.div
                key={`${u.id}-${updatedUser.assignedAgentId || "none"}`}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (!user) return alert("Utilisateur non défini");

                  if (isAgent) {
                    if (!isAssigned)
                      return alert("⚠️ Veuillez d’abord l’assigner pour y accéder");

                    if (isAssigned && !isMyCandidate)
                      return alert(`👀 Déjà assigné à ${updatedUser.assignedAgent?.nom || "un autre agent"}`);

                    // ✅ Candidat assigné à moi → accès autorisé
                    navigate(`/agent/candidats/${u.id}`, { state: { user } });
                  } else if (isAdmin) {
                    navigate(`/admin/candidats/${u.id}`, { state: { user } });
                  }
                }}
                className={`flex items-center justify-between p-2 rounded-xl transition bg-gradient-to-r from-gray-800 to-gray-700 hover:shadow-lg ${
                  isAgent && isAssigned && !isMyCandidate
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:bg-gray-800/70"
                }`}
              >
                {/* Infos candidat */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0 cursor-pointer hover:scale-105 transition">
                      {/* Cercle avec bordure */}
                      <img
                          src={u.photoUrl ? u.photoUrl : "/default-avatar.png"}
                          alt={`${u.nom} ${u.prenom}`}
                          className="w-10 h-10 rounded-full border-2 border-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(u.photoUrl ? u.photoUrl : "/default-avatar.png");
                          }}
                        />

                      {/* Badge de notifications */}
                      {unreadCounts[u.id] > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow z-10">
                          {unreadCounts[u.id]}
                        </span>
                      )}
                    </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-white">
                        {u.nom} {u.prenom}
                      </p>

                      {/* 🔹 Badge statut */}
                      <span
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-colors duration-300 ${
                          u.candidatureStatus === "ACCEPTE"
                            ? "bg-green-800 text-green-100"
                            : u.candidatureStatus === "REFUSE"
                            ? "bg-red-800 text-red-100"
                            : u.candidatureStatus === "EN_ATTENTE"
                            ? "bg-yellow-800 text-yellow-100"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {(() => {
                          switch (u.candidatureStatus?.trim()?.toUpperCase()) {
                            case "ACCEPTE":
                              return "Accepté";
                            case "REFUSE":
                              return "Refusé";
                            case "EN_ATTENTE":
                              return "En attente";
                            default:
                              return "not_postule";
                          }
                        })()}
                      </span>

                    </div>

                    <p className="text-sm text-gray-500 truncate">
                      {lastMessages[u.id]?.content
                        ? `${lastMessages[u.id].content} · ${new Date(lastMessages[u.id].createdAt).toLocaleString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "short",
                          })}`
                        : ""}
                    </p>
                  </div>
                </div>

              {/* ⚙️ Actions admin */}
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmAction({ type: "promote", user: u });
                    }}
                  >
                    Promouvoir
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmAction({ type: "delete", user: u });
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              )}

                {/* Boutons Agent */}
                {isAgent && !isAssigned && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmAction({ type: "assign", user: u });
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700"
                  >
                    Assigner
                  </button>
                )}

                {isAgent && isAssigned && isMyCandidate && (
                  <span className="text-green-400 text-xs font-semibold">✅ Assigné</span>
                )}

                {isAgent && isAssigned && !isMyCandidate && (
                  <span className="text-gray-400 text-xs font-semibold">
                    🔒 Assigné par {updatedUser.assignedAgent?.nom || "un autre agent"}
                  </span>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* 🖼️ Popup photo agrandie */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setSelectedPhoto(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedPhoto(null)}
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

      {/* 🔐 Popup confirmation admin */}
        <AnimatePresence>
          {confirmAction && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="bg-white p-6 rounded-lg shadow-xl w-96 relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Titre */}
                <h3 className="text-lg font-bold mb-4 text-gray-900">
                  {confirmAction.type === "delete"
                    ? "Confirmer la suppression"
                    : "Confirmer la promotion"}
                </h3>

                {/* Sélection rôle */}
                {confirmAction.type === "promote" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Choisir un rôle :
                    </label>
                    <select
                      value={confirmAction.role || ""}
                      onChange={(e) =>
                        setConfirmAction({ ...confirmAction, role: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="AGENT">Agent</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                )}

                {/* Mot de passe */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe admin :
                  </label>
                  <input
                    type="password"
                    placeholder="Entrez le mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  />
                </div>

                {/* Message action */}
                {message && (
                  <p
                    className={`text-sm mb-3 ${
                      message.startsWith("✅") ? "text-green-700" : "text-red-700"
                    } font-medium`}
                  >
                    {message}
                  </p>
                )}

                {/* Boutons */}
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    onClick={() => setConfirmAction(null)}
                  >
                    Annuler
                  </button>
                  <button
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                    onClick={handleConfirm}
                    disabled={loading || (confirmAction.type === "promote" && !confirmAction.role)}
                  >
                    {loading ? "..." : "Confirmer"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          {/* Popup assignation */}
      <AnimatePresence>
        {confirmAction && confirmAction.type === "assign" && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative">
              <h3 className="text-lg font-bold mb-4 text-gray-900">
                Confirmer l’assignation
              </h3>
              <label className="block text-sm mb-2 text-gray-700">Mot de passe :</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                placeholder="Entrez votre mot de passe"   
              />
              {message && (
                <p
                  className={`text-sm mb-3 ${
                    message.startsWith("✅") ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {message}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setConfirmAction(null)}
                >
                  Annuler
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => {
                    handleAssign(confirmAction.user.id);
                  }}
                  disabled={loading || !password}
                >
                  {loading ? "..." : "Confirmer"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );                   
}

