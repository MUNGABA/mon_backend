const app = require("./app");
const http = require("http");
const { init } = require("./socket");

const server = http.createServer(app);
const io = init(server);

// rendre io dispo dans req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// gestion socket.io
io.on("connection", (socket) => {
  console.log("🔌 Client connecté:", socket.id);

  // Rejoindre une room selon rôle
  socket.on("joinRole", (role) => {
    if (role === "ADMIN") socket.join("admins");
    if (role === "AGENT") socket.join("agents");
    console.log(`✅ ${role} rejoint sa room`);
  });

  // Rejoindre sa room perso
  socket.on("register", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`✅ User ${userId} rejoint sa room`);
  });

  // Rejoindre la room d’un candidat spécifique pour notifications
  socket.on("joinCandidate", (candidateId) => {
    socket.join(`candidate_${candidateId}`);
    console.log(`✅ Socket ${socket.id} rejoint candidate_${candidateId}`);
  });

  // 💬 Rejoindre une room de chat entre deux utilisateurs
  socket.on("joinChat", ({ userId, friendId }) => {
    if (!userId || !friendId) return;
    const room = [userId, friendId].sort().join("-");
    socket.join(room);
    console.log(`💬 User ${userId} a rejoint la room de chat ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client déconnecté:", socket.id);
  });
});

// 🔹 Fonction utilitaire pour envoyer notification
const sendCandidateNotification = (io, candidateId, actor, action) => {
  const payload = {
    actorName: `${actor.nom} ${actor.prenom}`,
    actorRole: actor.role,
    action,
  };

  // Envoyer à admin et agent
  io.to("admins").emit("notification", payload);
  io.to("agents").emit("notification", payload);

  // Envoyer au candidat seulement l’action sans nom/prénom
  io.to(`user_${candidateId}`).emit("notification", { action });

  // Envoyer à tous ceux qui suivent cette candidature (room spécifique)
  io.to(`candidate_${candidateId}`).emit("notification", payload);

  console.log(`🔔 Notification envoyée pour candidate_${candidateId}`, payload);
};

// 🔹 Exposer la fonction pour l’utiliser dans les routes
app.set("sendCandidateNotification", sendCandidateNotification);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
