// middlewares/restrictToCandidateContext.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ error: "Utilisateur non authentifié" });
    }

    if (!["ADMIN", "AGENT", "CANDIDAT"].includes(userRole)) {
      return res.status(403).json({ error: "Accès restreint aux échanges staff-candidat." });
    }

    // ✅ Protection req.body avec ?. pour éviter l'erreur
    let friendId =
      req.params.friendId ??
      req.params.senderId ??
      req.body?.receiverId ??
      req.body?.friendId;

    friendId = Number(friendId);

    // Si pas de friendId → on laisse passer
    if (!friendId || isNaN(friendId)) {
      return next();
    }

    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, role: true },
    });

    if (!friend) {
      return res.status(404).json({ error: "Utilisateur inexistant." });
    }

    // ✅ Condition d'accès : au moins l'un des deux doit être un candidat
    const roles = [userRole, friend.role];
    if (!roles.includes("CANDIDAT")) {
      return res.status(403).json({ error: "Les échanges sans candidat sont interdits." });
    }

    next();
  } catch (error) {
    console.error("restrictToCandidateContext err:", error);
    res.status(500).json({ error: "Erreur serveur dans la restriction." });
  }
};
