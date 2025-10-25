import React, { useState } from "react";

export default function AddNotificationForm({ onAdd }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message) return;

    const newNotification = { message, type, date: new Date() };
    if (onAdd) onAdd(newNotification);

    setMessage("");
    setType("info");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-xl p-4 flex flex-col gap-3"
    >
      <h2 className="text-lg font-bold text-gray-700">
        Ajouter une notification
      </h2>

      <textarea
        placeholder="Message de la notification"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:ring-2 focus:ring-blue-500"
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
      >
        <option value="info">Info</option>
        <option value="alerte">Alerte</option>
        <option value="succès">Succès</option>
      </select>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
      >
        Ajouter
      </button>
    </form>
  );
}
