// FriendsPage.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft, UserMinus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ChatModal from "../components/ChatModal";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket"] });

export default function FriendsPage({ user }) {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const navigate = useNavigate();

  const sortFriendsByLastMessage = (friendsList, lastMsgMap) =>
    [...friendsList].sort((a, b) => {
      const dateA = lastMsgMap[a.id]?.createdAt ? new Date(lastMsgMap[a.id].createdAt) : new Date(0);
      const dateB = lastMsgMap[b.id]?.createdAt ? new Date(lastMsgMap[b.id].createdAt) : new Date(0);
      return dateB - dateA;
    });

  const fetchFriends = async () => {
    try {
      const res = await api.get("/friendships/friends");
      setFriends(res.data);
    } catch (err) {
      console.error("Erreur chargement amis :", err);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get("/messages/unread/counts");
      setUnreadCounts(res.data || {});
    } catch (err) {
      console.error("Erreur fetch unread", err);
    }
  };

  const fetchLastMessages = async () => {
    try {
      const res = await api.get("/messages/last");
      setLastMessages(res.data || {});
    } catch (err) {
      console.error("Erreur fetch last messages", err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const init = async () => {
      await fetchFriends();
      await fetchUnreadCounts();
      await fetchLastMessages();
    };
    init();

    socket.emit("joinUser", user.id);

    socket.on("newMessage", (msg) => {
      const friendId = msg.senderId === user.id ? msg.receiverId : msg.senderId;

      setLastMessages((prev) => ({
        ...prev,
        [friendId]: { content: msg.content, createdAt: msg.createdAt }
      }));

      if (msg.receiverId === user.id && (!activeChat || activeChat.id !== friendId)) {
        setUnreadCounts((prev) => ({ ...prev, [friendId]: (prev[friendId] || 0) + 1 }));
      }

      if (activeChat && activeChat.id === msg.senderId) {
        api.put("/messages/seen", { friendId: msg.senderId });
        setUnreadCounts((prev) => ({ ...prev, [msg.senderId]: 0 }));
      }
    });

    return () => socket.off("newMessage");
  }, [user, activeChat]);

  useEffect(() => {
    setFriends((prev) => sortFriendsByLastMessage(prev, lastMessages));
  }, [lastMessages]);

  const handleRemoveFriend = async (friendId, e) => {
    e.stopPropagation();
    if (!window.confirm("Voulez-vous retirer cet ami ?")) return;
    try {
      await api.post("/friendships/remove", { friendId });
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
    } catch (err) {
      console.error("Erreur suppression ami :", err);
    }
  };

  const openChat = async (friend) => {
    setActiveChat(friend);
    if ((unreadCounts[friend.id] || 0) > 0) {
      try {
        await api.put("/messages/seen", { friendId: friend.id });
        setUnreadCounts((prev) => ({ ...prev, [friend.id]: 0 }));
      } catch (err) {
        console.error("Erreur markAsSeen", err);
      }
    }
  };

      const getPhotoUrl = (photo) => {
      if (!photo) return "/default-avatar.png";

      // Si c’est déjà une URL complète (Cloudinary ou externe)
      if (photo.startsWith("http")) {
        if (photo.includes("res.cloudinary.com")) {
          const url = new URL(photo);
          if (!url.pathname.includes("/c_fill")) {
            const parts = url.pathname.split("/upload/");
            if (parts.length === 2) {
              return `${parts[0]}/upload/c_fill,w_200,h_200,f_auto,q_auto/${parts[1]}`;
            }
          }
        }
        return photo; // URL externe non Cloudinary
      }

      // Cas serveur local (uploads)
      return `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${photo}`;
    };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded"
        >
          <ArrowLeft size={18} /> Retour
        </button>
        <h1 className="text-2xl font-bold text-cyan-400 text-center flex-1">
          Mes Amis
        </h1>
      </div>

      {/* Layout desktop */}
      <div className="hidden lg:flex flex-row gap-4 h-[calc(100vh-6rem)]">
        {/* Colonne gauche : liste amis */}
        <div className="w-1/2 overflow-y-auto bg-blue-900/50 rounded-xl p-4">
          {/* Recherche */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Rechercher un ami..."
              className="w-full bg-blue-800/60 border border-blue-700 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Liste amis */}
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {filtered.map((f) => (
                <motion.div
                  key={f.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => openChat(f)}
                  className="flex items-center justify-between bg-blue-800/40 border border-blue-700 hover:border-cyan-400 hover:bg-blue-800/60 rounded-xl p-3 cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="relative w-12 h-12 cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(getPhotoUrl(f.photo));
                      }}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-cyan-400">
                        <img
                          src={getPhotoUrl(f.photo)}
                          alt={f.nom}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {(unreadCounts[f.id] ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                          {unreadCounts[f.id]}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <p className="font-semibold text-white text-sm leading-tight">{f.nom} {f.prenom}</p>
                      <p className="text-xs text-gray-300 truncate max-w-[200px]">{lastMessages[f.id]?.content || ""}</p>
                      <p className="text-[11px] text-gray-400">
                        {lastMessages[f.id]?.createdAt ? new Date(lastMessages[f.id].createdAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : ""}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleRemoveFriend(f.id, e)}
                    className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
                  >
                    <UserMinus size={14} /> Retirer
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Colonne droite : chat */}
        <div className={`w-1/2 h-full flex flex-col ${!activeChat ? 'hidden' : ''}`}>
          {activeChat ? (
            <ChatModal
              user={user}
              friend={activeChat}
              onClose={() => setActiveChat(null)}
              setLastMessages={setLastMessages}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-center p-4">
              <p>Veuillez choisir un ami pour commencer votre conversation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Layout mobile : transition simple */}
          <div className="lg:hidden relative h-[calc(100vh-6rem)] overflow-hidden">
            <AnimatePresence initial={false}>
              {!activeChat && (
                <motion.div
                  key="friends-list"
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                  exit={{ x: 0 }}
                  transition={{ type: "tween", duration: 0.2 }}
                  className="absolute inset-0 overflow-y-auto flex flex-col bg-blue-900/50 rounded-xl p-4"
                >
                  {/* Barre de recherche */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Rechercher un ami..."
                      className="w-full bg-blue-800/60 border border-blue-700 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Liste amis */}
                  <motion.div layout className="space-y-3">
                    <AnimatePresence>
                      {filtered.map((f) => (
                        <motion.div
                          key={f.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ type: "tween", duration: 0.15 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openChat(f)}
                          className="flex items-center justify-between bg-blue-800/40 border border-blue-700 hover:border-cyan-400 hover:bg-blue-800/60 rounded-xl p-3 cursor-pointer shadow-sm"
                        >
                          {/* Carte ami */}
                          <div className="flex items-center gap-3">
                            <div
                              className="relative w-12 h-12 cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPhoto(getPhotoUrl(f.photo));
                              }}
                            >
                              <div className="w-full h-full rounded-full overflow-hidden border-2 border-cyan-400">
                                <img src={getPhotoUrl(f.photo)} alt={f.nom} className="w-full h-full object-cover" />
                              </div>
                              {(unreadCounts[f.id] ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
                                  {unreadCounts[f.id]}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <p className="font-semibold text-white text-sm leading-tight">{f.nom} {f.prenom}</p>
                              <p className="text-xs text-gray-300 truncate max-w-[200px]">{lastMessages[f.id]?.content || ""}</p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => handleRemoveFriend(f.id, e)}
                            className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md"
                          >
                            <UserMinus size={14} /> Retirer
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}

              {activeChat && (
                <motion.div
                  key="chat-modal"
                  initial={{ x: 5 }}
                  animate={{ x: 0 }}
                  exit={{ x: 0 }}
                  transition={{ type: "tween", duration: 0.2 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <ChatModal
                    user={user}
                    friend={activeChat}
                    onClose={() => setActiveChat(null)}
                    setLastMessages={setLastMessages}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      {/* Pop-up photo */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[1px] bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center z-50"
              >
                ✕
              </button>
              <img
                src={selectedPhoto}
                alt="Ami"
                className="max-h-[70vh] max-w-[70vw] object-contain shadow-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
