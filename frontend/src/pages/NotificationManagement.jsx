import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function NotificationManagement() {
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("ALL");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSend = async () => {
    if (!message.trim()) return alert("Veuillez entrer un message.");
    setLoading(true);
    try {
      await api.post("/notifications/send", {
      message,
      targetRole: recipientType === "ALL" ? null : recipientType,
      userIds: recipientType === "CUSTOM" ? selectedUsers : [],
      });
      alert("✅ Notification envoyée !");
      setMessage("");
      setRecipientType("ALL");
      setSelectedUsers([]);
    } catch (err) {
      console.error("Erreur envoi notif:", err);
      alert("❌ Erreur lors de l’envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/admin")}
        className="mb-4 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
      >
        ⬅ Retour au Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">Gestion des Notifications</h1>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border p-2 rounded mb-4"
        rows={4}
        placeholder="Écrire la notification ici..."
      />

      <div className="mb-4">
        <label className="font-semibold block mb-2">Destinataires :</label>
        <select
          value={recipientType}
          onChange={(e) => setRecipientType(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="ALL">Tout le monde</option>
          <option value="CANDIDAT">Candidats</option>
          <option value="AGENT">Agents</option>
          <option value="ADMIN">Admins</option>
          <option value="CUSTOM">Sélection manuelle</option>
        </select>
      </div>

      {recipientType === "CUSTOM" && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mt-2">
            {recipientType === "ALL"
            ? "Notification globale (tout le monde)"
            : recipientType === "CUSTOM"
            ? `Notification ciblée : ${selectedUsers.length} utilisateurs`
            : `Notification destinée aux ${recipientType.toLowerCase()}s`}
          </p>

          <input
            type="text"
            value={selectedUsers.join(",")}
            onChange={(e) =>
              setSelectedUsers(
                e.target.value
                  .split(",")
                  .map((id) => id.trim())
                  .filter(Boolean)
              )
            }
            placeholder="Ex: 1, 2, 3"
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Envoi en cours..." : "Envoyer la notification"}
      </button>
    </div>
  );
}
