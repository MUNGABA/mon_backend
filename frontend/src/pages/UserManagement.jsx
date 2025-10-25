// src/pages/UserManagement.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, action: null, userId: null, extra: null });
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users/all");
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const normalizeRole = (role) => role?.toUpperCase();

  const admins = users.filter((u) => normalizeRole(u.role) === "ADMIN");
  const agents = users.filter((u) => normalizeRole(u.role) === "AGENT");
  const candidats = users.filter((u) => normalizeRole(u.role) === "CANDIDAT");

  // === 📌 Ouvrir modal ===
  const openModal = (action, userId, extra = null) => {
    setPassword("");
    setModal({ open: true, action, userId, extra });
  };

  // === 📌 Fermer modal ===
  const closeModal = () => {
    setPassword("");
    setModal({ open: false, action: null, userId: null, extra: null });
  };

  // === 📌 Confirmer action ===
  const confirmAction = async () => {
    if (!password) {
      alert("⚠ Mot de passe requis !");
      return;
    }

    try {
      const adminEmail = localStorage.getItem("adminEmail");
      if (!adminEmail) {
        alert("⚠ Admin non connecté !");
        return;
      }

      if (modal.action === "role") {
        await api.post("/admin/promote", {
          userId: modal.userId,
          role: modal.extra,
          adminEmail,
          password,
        });
        alert("✅ Rôle mis à jour !");
      } else if (modal.action === "status") {
        await api.post("/admin/status", {
          userId: modal.userId,
          active: modal.extra,
          adminEmail,
          password,
        });
        alert(`✅ Utilisateur ${modal.extra ? "activé" : "désactivé"} !`);
      } else if (modal.action === "delete") {
        await api.post("/admin/delete", {
          userId: modal.userId,
          adminEmail,
          password,
        });
        alert("✅ Utilisateur supprimé !");
      }

      fetchUsers();
      closeModal();
    } catch (err) {
      console.error("Erreur action:", err);
      alert("❌ Erreur : " + (err.response?.data?.message || "Serveur"));
    }
  };

  // === 📌 Table utilisateurs ===
  const renderTable = (title, list) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {list.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucun utilisateur trouvé.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg shadow">
          <table className="min-w-full border-collapse text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-0.5 border">Nom</th>
                <th className="px-2 py-0.5 border">Postnom</th>
                <th className="px-2 py-0.5 border">Prénom</th>
                <th className="px-2 py-0.5 border">Email</th>
                <th className="px-2 py-0.5 border">Rôle</th>
                <th className="px-2 py-0.5 border">Statut</th>
                <th className="px-2 py-0.5 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-2 py-0.5 border">{u.nom}</td>
                  <td className="px-2 py-0.5 border">{u.postnom}</td>
                  <td className="px-2 py-0.5 border">{u.prenom}</td>
                  <td className="px-2 py-0.5 border">{u.email}</td>
                  <td className="px-2 py-0.5 border">{u.role}</td>
                  <td className="px-2 py-0.5 border">
                    {u.active ? "✅ Actif" : "⛔ Inactif"}
                  </td>
                  <td className="px-2 py-0.5 border space-x-1">
                    {/* Changer rôle */}
                    <select
                      value={normalizeRole(u.role)}
                      onChange={(e) => openModal("role", u.id, e.target.value)}
                      className="border rounded px-1 py-0.5 text-xs"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="AGENT">Agent</option>
                      <option value="CANDIDAT">Candidat</option>
                    </select>

                    {/* Activer/Désactiver */}
                    <button
                      onClick={() => openModal("status", u.id, !u.active)}
                      className={`px-2 py-0.5 text-xs rounded ${
                        u.active ? "bg-yellow-500 text-white" : "bg-green-600 text-white"
                      }`}
                    >
                      {u.active ? "Désactiver" : "Activer"}
                    </button>

                    {/* Supprimer */}
                    <button
                      onClick={() => openModal("delete", u.id)}
                      className="px-2 py-0.5 bg-red-600 text-white text-xs rounded"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Retour */}
      <button
        onClick={() => navigate("/admin")}
        className="mb-6 bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
      >
        ⬅ Retour au Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h1>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          {renderTable("👑 Admins", admins)}
          {renderTable("🛠 Agents", agents)}
          {renderTable("👤 Candidats", candidats)}
        </>
      )}

      {/* === Modal Confirmation === */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
           <div className="bg-white rounded-lg shadow-lg w-96 p-6">
            <h2 className="text-lg font-bold mb-4">🔒 Confirmation requise</h2>
            <p className="text-sm text-gray-600 mb-3">
              Action : <span className="font-semibold">{modal.action}</span>
            </p>
            <input
              type="password"
              placeholder="Entrez votre mot de passe admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Annuler
              </button>
              <button
                onClick={confirmAction}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
