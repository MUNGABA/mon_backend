import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import api from "../services/api";

export default function NotificationsAgentCandidat({ notifications = [], user }) {
  const [notifList, setNotifList] = useState([]);

  const role = user?.role?.toUpperCase();

  useEffect(() => {
    setNotifList(notifications);
  }, [notifications]);

  // === Supprimer pour soi ===
  const deleteForMe = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifList((prev) =>
        prev.filter((n) => n.notification.id !== id && n.id !== id)
      );
    } catch (err) {
      console.error("Erreur suppression notif:", err);
      alert("Erreur suppression");
    }
  };

  // === Couleur selon le rôle ciblé ===
  const getColor = (targetRole) => {
    switch (targetRole) {
      case "ADMIN":
        return "border-red-500 text-red-600 bg-red-50";
      case "AGENT":
        return "border-blue-500 text-blue-600 bg-blue-50";
      case "CANDIDAT":
        return "border-green-500 text-green-600 bg-green-50";
      default:
        return "border-gray-300 text-gray-700 bg-gray-50";
    }
  };

  // === Filtrer les notifs selon le rôle connecté ===
  const filteredNotifications = notifList.filter((n) => {
    const target = n.notification?.role || n.role;
    if (role === "AGENT") return ["AGENT", "CANDIDAT", null].includes(target);
    return ["CANDIDAT", null].includes(target);
  });

  return (
    <div className="bg-white shadow-md rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Notifications</h3>

      {filteredNotifications.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune notification</p>
      ) : (
        <ul className="space-y-3">
          {filteredNotifications.map((n) => {
            const notif = n.notification || n;
            const colorClass = getColor(notif.role);
            const bg = n.seen ? "bg-white" : "bg-blue-50";

            return (
              <li
                key={notif.id}
                className={`p-3 rounded-lg border-l-4 ${colorClass} ${bg} shadow-sm`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-700 font-medium">{notif.message}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()}{" "}
                      {notif.role && (
                        <span className="italic">({notif.role})</span>
                      )}
                    </span>
                    {!n.seen && (
                      <span className="ml-2 text-yellow-600 text-xs font-semibold">
                        • Non lu
                      </span>
                    )}
                  </div>

                  {/* Supprimer pour soi */}
                  <button
                    onClick={() => deleteForMe(notif.id)}
                    className="text-gray-500 hover:text-red-600"
                    title="Supprimer pour moi"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
