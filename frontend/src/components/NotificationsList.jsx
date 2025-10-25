import React, { useState, useEffect } from "react";
import { Trash2, Eye } from "lucide-react";
import api from "../services/api";

export default function NotificationsList({ notifications = [], user, onCreate, socket }) {
  const [notifList, setNotifList] = useState([]);
  const [views, setViews] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);

  const role = user?.role?.toUpperCase();

  // 🔹 Sync props notifications → state local
  useEffect(() => {
    setNotifList(notifications);
  }, [notifications]);

  // === Temps réel : réception notification Socket.io ===
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notif) => {
      // filtrage côté client selon rôle
      const target = notif.role || "GLOBAL";
      if (
        role === "ADMIN" ||
        (role === "AGENT" && ["AGENT", "CANDIDAT", "GLOBAL"].includes(target)) ||
        (role === "CANDIDAT" && ["CANDIDAT", "GLOBAL"].includes(target))
      ) {
        setNotifList((prev) => [notif, ...prev]);
      }
    };

    socket.on(`notification_${user.id}`, handleNotification);
    socket.on(`notification`, handleNotification);
    socket.on(`notification_CANDIDAT`, handleNotification);

    return () => {
      socket.off(`notification_${user.id}`, handleNotification);
      socket.off(`notification`, handleNotification);
      socket.off(`notification_CANDIDAT`, handleNotification);
    };
  }, [socket, user.id, role]);

  // === Supprimer pour soi ===
  const deleteForMe = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifList((prev) => prev.filter((n) => n.id !== id && n.notification?.id !== id));
    } catch (err) {
      console.error("Erreur suppression notif:", err);
      alert("Erreur suppression");
    }
  };

  // === Supprimer globalement (ADMIN uniquement) ===
  const deleteGlobal = async (id) => {
    if (!window.confirm("Supprimer cette notification globalement ?")) return;
    try {
      await api.delete(`/notifications/${id}/admin`);
      setNotifList((prev) => prev.filter((n) => n.id !== id && n.notification?.id !== id));
      alert("Notification supprimée globalement ✅");
    } catch (err) {
      console.error("Erreur suppression globale:", err);
      alert("Erreur suppression globale");
    }
  };

  // === Voir les utilisateurs ayant vu la notif (ADMIN uniquement) ===
  const fetchViews = async (id) => {
    try {
      const res = await api.get(`/notifications/${id}/views`);
      setSelectedNotif(id);
      setViews(res.data);
    } catch (err) {
      console.error("Erreur récupération vues:", err);
    }
  };

  // === Marquer toutes les notifications comme vues à la sortie ===
  useEffect(() => {
    const handleBeforeUnload = () => {
      api
        .put("/notifications/seen")
        .then(() => console.log("✅ Notifications marquées comme vues"))
        .catch((err) => console.error("Erreur marquage vu à la sortie", err));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // === Couleur de bordure selon le rôle ciblé ===
  const getBorderColor = (targetRole) => {
    switch (targetRole) {
      case "ADMIN":
        return "border-red-500 text-red-600";
      case "AGENT":
        return "border-blue-500 text-blue-600";
      case "CANDIDAT":
        return "border-green-500 text-green-600";
      default:
        return "border-gray-300 text-gray-700";
    }
  };

  // === Filtrer les notifications selon le rôle connecté ===
  const filteredNotifications = notifList.filter((n) => {
    const target = n.notification?.role || n.role || null;
    if (role === "ADMIN") return true;
    if (role === "AGENT") return ["AGENT", "CANDIDAT", null].includes(target);
    if (role === "CANDIDAT") return ["CANDIDAT", null].includes(target);
    return false;
  });

  return (
    <div className="bg-white shadow-md rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex justify-between">
        Notifications
        {role === "ADMIN" && (
          <button
            onClick={onCreate}
            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            + Nouvelle
          </button>
        )}
      </h3>

      {filteredNotifications.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune notification</p>
      ) : (
        <ul className="space-y-3">
          {filteredNotifications.map((n) => {
            const notif = n.notification || n;
            const borderClass = getBorderColor(notif.role);
            const isSeen = n.seen;
            const bgClass = isSeen ? "bg-white" : "bg-blue-50";

            return (
              <li
                key={notif.id}
                className={`p-3 rounded-lg border-l-4 ${borderClass} ${bgClass} shadow-sm transition-colors duration-300`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-700 font-medium">{notif.message}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()}{" "}
                      {notif.role && <span className="italic">({notif.role})</span>}
                    </span>
                    {!isSeen && (
                      <span className="ml-2 text-blue-600 text-xs font-semibold">• Non lu</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Supprimer pour soi */}
                    <button
                      onClick={() => deleteForMe(notif.id)}
                      className="text-gray-500 hover:text-red-600"
                      title="Supprimer pour moi"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* ADMIN : voir qui a vu & supprimer globalement */}
                    {role === "ADMIN" && (
                      <>
                        <button
                          onClick={() => fetchViews(notif.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Voir qui a vu"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteGlobal(notif.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Supprimer globalement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Liste des vues (admin uniquement) */}
                {role === "ADMIN" && selectedNotif === notif.id && views.length > 0 && (
                  <div className="mt-2 text-xs bg-gray-50 border p-2 rounded">
                    <p className="font-semibold mb-1">👀 Vu par :</p>
                    <ul className="list-disc list-inside">
                      {views.map((v) => (
                        <li key={v.id}>
                          {v.user.nom} {v.user.postnom} ({v.user.role}){" "}
                          {v.seenAt ? "✅" : "❌"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
