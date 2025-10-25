// ChatModal.jsx
import React, { useEffect, useState, useRef } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { io } from "socket.io-client";
import api from "../services/api";

const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket"] });

export default function ChatModal({ user, friend, onClose, setLastMessages }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const scrollRef = useRef(null);

  // 📥 Charger l'historique et écouter le socket
  useEffect(() => {
    if (!user?.id || !friend?.id) return;

    const fetchMessages = async () => {
      try {
        const res = await api.get(`/messages/${friend.id}`);
        setChat(res.data);
      } catch (err) {
        console.error("Erreur chargement messages:", err);
      }
    };

    fetchMessages();
    socket.emit("joinUser", user.id);

    const handleNewMessage = (msg) => {
      if (
        (msg.senderId === user.id && msg.receiverId === friend.id) ||
        (msg.senderId === friend.id && msg.receiverId === user.id)
      ) {
        setChat((prev) => [...prev, msg]);
        setLastMessages?.((prev) => ({
          ...prev,
          [friend.id]: { content: msg.content, createdAt: msg.createdAt },
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [user, friend]);

  // 📜 Scroll automatique vers le bas
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // ✉️ Envoyer un message
  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    try {
      const res = await api.post("/messages", {
        receiverId: friend.id,
        content: trimmed,
      });

      const sentMsg = res.data;
      setChat((prev) => [...prev, sentMsg]);
      setMessage("");

      setLastMessages?.((prev) => ({
        ...prev,
        [friend.id]: { content: sentMsg.content, createdAt: sentMsg.createdAt },
      }));

      socket.emit("sendMessage", sentMsg);
    } catch (err) {
      console.error("Erreur envoi message:", err);
    }
  };

  const getPhotoUrl = (photo) => {
    if (!photo) return "/default-avatar.png";
    return `${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/${photo}`;
  };

  return (
    <div className="flex flex-col h-full bg-blue-900/50 rounded-xl overflow-hidden">
      {/* 🔹 HEADER */}
      <div className="flex items-center gap-3 p-4 border-b border-blue-800">
        {/* 🔹 Bouton retour sur mobile */}
        <button
          onClick={onClose}
          className="md:hidden text-white hover:text-cyan-400 transition"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-cyan-400">
          <img
            src={getPhotoUrl(friend.photo)}
            alt={friend.nom}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="text-white font-semibold leading-tight">
            {friend.nom} {friend.prenom}
          </p>
          <p className="text-xs text-gray-400">En ligne</p>
        </div>
      </div>

      {/* 💬 MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-blue-950">
        {chat.length === 0 ? (
          <p className="text-center text-gray-400 mt-10 text-sm">
            Commencez la conversation en envoyant un message.
          </p>
        ) : (
          chat.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[75%] px-3 py-2 rounded-2xl shadow-md ${
                  msg.senderId === user.id
                    ? "bg-cyan-600 text-white rounded-br-none"
                    : "bg-blue-800 text-gray-100 rounded-bl-none"
                }`}
              >
                <p className="text-[15px] leading-snug">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    msg.senderId === user.id ? "text-gray-200 text-right" : "text-gray-400 text-left"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* 📝 INPUT */}
      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-blue-800 px-4 py-3">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 bg-blue-800 text-white placeholder-gray-400 px-3 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <button type="submit" className="ml-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 transition">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
