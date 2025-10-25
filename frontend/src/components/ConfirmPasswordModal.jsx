import { useState } from "react";

export default function ConfirmPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState("");

  const handleConfirm = () => {
    // ⚠️ Ici on fera un appel API pour supprimer l'utilisateur avec mot de passe admin
    console.log("Suppression confirmée pour :", user);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Confirmer la suppression
        </h2>
        <p className="text-gray-600 mb-4">
          Entrez votre mot de passe pour supprimer{" "}
          <strong>{user?.prenom} {user?.nom}</strong>.
        </p>
        <input
          type="password"
          placeholder="Mot de passe"
          className="w-full border rounded-lg p-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
