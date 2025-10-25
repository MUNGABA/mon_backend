import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../services/api";
import NotificationsList from "../components/NotificationsList";
import { useAuth } from "../contexts/AuthContext";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // 🔹 Charger les notifications existantes depuis la base
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get("/notifications/me");
        const sorted = res.data.sort(
          (a, b) =>
            new Date(b.notification.createdAt) - new Date(a.notification.createdAt)
        );
        setNotifications(sorted);
      } catch (err) {
        console.error("Erreur récupération notifs", err);
      }
    };
    if (user?.id) fetchNotifs();
  }, [user?.id]);

  // 🔹 Socket temps réel pour toutes les notifications pertinentes
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000");

    // Notifications personnelles
    socket.on(`notification_${user.id}`, (notif) => {
      const formatted = {
        id: notif.recipients?.find((r) => r.userId === user.id)?.id || Date.now(),
        seen: false,
        seenAt: null,
        notification: {
          id: notif.id,
          message: notif.message,
          createdAt: notif.createdAt,
          role: notif.role || null,
        },
      };

      setNotifications((prev) => {
        const exists = prev.some(
          (n) => n.notification.id === formatted.notification.id
        );
        if (exists) return prev;
        return [formatted, ...prev].sort(
          (a, b) =>
            new Date(b.notification.createdAt) - new Date(a.notification.createdAt)
        );
      });
    });

    // Notifications globales pour admins/agents
    if (["ADMIN", "AGENT"].includes(user.role)) {
      socket.on(`notification_ADMIN_AGENT`, (notif) => {
        const formatted = {
          id: notif.id || Date.now(),
          seen: false,
          seenAt: null,
          notification: {
            id: notif.id,
            message: notif.message,
            createdAt: notif.createdAt,
            role: notif.role || null,
          },
        };

        setNotifications((prev) => {
          const exists = prev.some(
            (n) => n.notification.id === formatted.notification.id
          );
          if (exists) return prev;
          return [formatted, ...prev].sort(
            (a, b) =>
              new Date(b.notification.createdAt) - new Date(a.notification.createdAt)
          );
        });
      });
    }

    return () => socket.disconnect();
  }, [user?.id, user?.role]);

  // 🔹 Marquer toutes les notifications comme lues côté backend
  useEffect(() => {
    if (notifications.length > 0) {
      api.put("/notifications/seen").catch((err) =>
        console.error("Erreur mise à jour seen", err)
      );
    }
  }, [notifications.length]);

  // 🔹 Sélection du composant selon le rôle
  const renderNotifications = () => {
    if (!user) return null;

    if (user.role === "ADMIN") {
      return (
        <NotificationsList
          notifications={notifications || []}
          user={user}
          onCreate={() => navigate("/admin/notifications")}
        />
      );
    }

    // Pour AGENT & CANDIDAT
    return (
      <NotificationsList
        notifications={notifications || []}
        user={user}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Bouton retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Retour
      </button>

      <h2 className="text-2xl font-bold mb-4">Mes Notifications</h2>

      {renderNotifications()}
    </div>
  );
}
