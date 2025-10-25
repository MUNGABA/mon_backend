import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Users, Search } from "lucide-react";
import api from "../services/api";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ["websocket"] });

export default function Navbar({ user, onSearchChange }) {
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // 🔔 Charger notifications non vues
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get("/notifications/me");
        const unseen = res.data.filter((n) => !n.seen);
        setNotifCount(unseen.length);
      } catch (err) {
        console.error("Erreur chargement notifications :", err);
      }
    };

    fetchNotifs();

    if (user?.id) {
      socket.emit("joinUser", user.id);
      socket.on(`notification_${user.id}`, () => setNotifCount((p) => p + 1));
      socket.on("notificationsSeen", () => setNotifCount(0));
    }

    return () => {
      if (user?.id) {
        socket.off(`notification_${user.id}`);
        socket.off("notificationsSeen");
      }
    };
  }, [user?.id]);

  // 💬 Messages non lus
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get("/messages/unread/counts");
        const total = Object.values(res.data).reduce((sum, c) => sum + c, 0);
        setMsgCount(total);
      } catch (err) {
        console.error("Erreur chargement messages non lus :", err);
      }
    };

    fetchUnread();

    socket.on("newMessage", () => setMsgCount((p) => p + 1));
    socket.on("messagesSeen", () => setMsgCount(0));

    return () => {
      socket.off("newMessage");
      socket.off("messagesSeen");
    };
  }, []);

  const goToProfile = () => {
    if (user?.role === "CANDIDAT") navigate("/profile");
    else if (user?.role === "AGENT") navigate("/agent/profile");
    else if (user?.role === "ADMIN") navigate("/admin/profile");
    else navigate("/login");
  };

  const goToFriends = () => navigate("/amis");

  const goToNotifications = async () => {
    navigate("/notifications");
    setNotifCount(0);
    try {
      await api.put("/notifications/seen");
      socket.emit("notificationsSeen", user.id);
    } catch (err) {
      console.error("Erreur mise à jour notifications :", err);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    onSearchChange?.(value);
  };

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center flex-wrap gap-4">
      {/* 👋 Message de bienvenue */}
      <h1 className="text-xl font-bold text-blue-600 whitespace-nowrap">
        Bienvenue {user?.prenom || user?.nom || "Utilisateur"} 
      </h1>

      {/* 🔍 Barre de recherche amis (seulement pour candidats) */}
{user?.role === "CANDIDAT" && (
  <>
    {/* Barre visible sur écrans md et + */}
    <div className="hidden md:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 shadow-sm flex-1 max-w-md mx-auto">
      <Search size={18} className="text-blue-600" />
      <input
        type="text"
        placeholder="Rechercher un ami..."
        value={search}
        onChange={handleSearch}
        className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
      />
    </div>

        {/* Icône seule visible sur petits écrans */}
        <div className="flex md:hidden relative">
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
          >
            <Search size={22} />
          </button>

          {/* Champ de recherche qui apparaît quand on clique */}
          {showSearch && (
            <div className="absolute top-12 right-0 bg-white border border-blue-200 rounded-lg shadow-lg p-2 w-56 flex items-center gap-2 z-50">
              <Search size={16} className="text-blue-600" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={handleSearch}
                autoFocus
                className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          )}
        </div>
      </>
    )}

      {/* 🔔 Icônes de droite */}
      <div className="flex items-center space-x-5">
        {/* 👥 Amis */}
        <button
          onClick={goToFriends}
          className="relative hover:text-blue-600 transition text-gray-600"
          title="Mes amis"
        >
          <Users className="w-6 h-6" />
          {msgCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
              {msgCount}
            </span>
          )}
        </button>

        {/* 🔔 Notifications */}
        <div
          className="relative cursor-pointer"
          onClick={goToNotifications}
          title="Notifications"
        >
          <Bell className="w-6 h-6 text-gray-600 hover:text-blue-600" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
              {notifCount}
            </span>
          )}
        </div>

        {/* 🚪 Déconnexion */}
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
          className="text-gray-600 hover:text-red-500 transition"
        >
          Déconnexion
        </button>

        {/* 🧑 Profil */}
        <div onClick={goToProfile} className="cursor-pointer" title="Mon profil">
          <img
            src={user?.photoUrl || "/default-avatar.png"}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-600 hover:border-blue-800 transition"
          />
        </div>
      </div>
    </nav>
  );
}
