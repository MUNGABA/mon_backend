const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * getConversationPro
 * ==============================
 * Récupère l'historique complet d'un utilisateur donné.
 * - Les agents voient tout l'historique uniquement si le candidat est assigné à eux.
 * - Sinon, ils ne voient rien (ou seulement le dernier message dans getLastMessagesPro).
 * - Les admins voient tout.
 */
exports.getConversationPro = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const friendId = Number(req.params.friendId);

    if (isNaN(friendId)) return res.status(400).json({ error: "friendId invalide" });

    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, role: true, assignedAgentId: true },
    });

    if (!friend) return res.status(404).json({ error: "Utilisateur introuvable" });

    // ⚡ Candidats ne peuvent pas discuter entre eux
    if (userRole === "CANDIDAT" && friend.role === "CANDIDAT") {
      return res.status(403).json({ error: "Les candidats ne peuvent pas discuter entre eux." });
    }

    // ⚡ Règles pour agents
    if (userRole === "AGENT") {
      if (![ "CANDIDAT", "ADMIN"].includes(friend.role)) {
        return res.status(403).json({ error: "Les agents ne peuvent parler qu’aux candidats ou admins." });
      }
      if (friend.role === "CANDIDAT" && friend.assignedAgentId && friend.assignedAgentId !== userId) {
        return res.status(403).json({ error: "Vous ne pouvez pas accéder à l'historique de ce candidat." });
      }
    }

    // ⚡ Récupération de tous les messages pertinents
   // ✅ Nouvelle version qui fusionne les échanges admin ↔ agent ↔ candidat
let messages;

if (["ADMIN", "AGENT"].includes(userRole) && friend.role === "CANDIDAT") {
  // Admin & Agent voient tout ce qui concerne ce candidat
  messages = await prisma.messagePro.findMany({
    where: {
      OR: [
        { senderId: friendId },
        { receiverId: friendId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, role: true } },
      receiver: { select: { id: true, role: true } },
    },
  });
} else {
  // Cas normal
  messages = await prisma.messagePro.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, role: true } },
      receiver: { select: { id: true, role: true } },
    },
  });
}


    res.json(messages);
  } catch (err) {
    console.error("getConversationPro err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * sendMessagePro
 * ==============================
 */
exports.sendMessagePro = async (req, res) => {
  console.log("🟡 sendMessagePro CALLED");
  console.log("📩 req.body =", req.body);
  console.log("👤 req.user =", req.user);
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { receiverId, content } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: "Le message est vide." });

        // ⚠️ Vérification générale : interdiction candidat ↔ candidat
    if (receiverId) {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true },
      });

      if (!receiver) {
        return res.status(404).json({ error: "Destinataire introuvable." });
      }

      if (userRole === "CANDIDAT" && receiver.role === "CANDIDAT") {
        return res.status(403).json({
          error: "Les échanges entre candidats sont interdits sur messages-pro.",
        });
      }
    }


    // ---------- ADMIN ----------
    if (userRole === "ADMIN") {
      const msg = await prisma.messagePro.create({
        data: { senderId: userId, receiverId, content },
        include: {
          sender: { select: { id: true, role: true } },
          receiver: { select: { id: true, role: true } },
        },
      });

      const agents = await prisma.user.findMany({ where: { role: "AGENT" }, select: { id: true } });
      const recipients = [userId, receiverId, ...agents.map(a => a.id)];

      recipients.forEach(rId => req.io?.to(`user_${rId}`).emit("newMessagePro", msg));

      // 🔥 Recalcul des compteurs
      for (const id of recipients) {
        const counts = await prisma.messagePro.groupBy({
          by: ["senderId"],
          where: { receiverId: id, seen: false },
          _count: { senderId: true },
        });
        const countsMap = {};
        counts.forEach(item => countsMap[item.senderId] = item._count.senderId);
        req.io?.to(`user_${id}`).emit("unreadCountUpdated", countsMap);
      }

      return res.json(msg);
    }

    // ---------- AGENT ----------
    if (userRole === "AGENT") {
      const candidate = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true, assignedAgentId: true },
      });

      if (!candidate) return res.status(404).json({ error: "Candidat introuvable." });
      if (candidate.role !== "CANDIDAT") return res.status(403).json({ error: "Un agent ne peut écrire qu’à un candidat." });
      if (candidate.assignedAgentId && candidate.assignedAgentId !== userId)
        return res.status(403).json({ error: "Ce candidat est déjà assigné à un autre agent." });

      if (!candidate.assignedAgentId) {
        await prisma.user.update({
          where: { id: receiverId },
          data: { assignedAgentId: userId },
        });
      }

      const msg = await prisma.messagePro.create({
        data: { senderId: userId, receiverId, content },
        include: {
          sender: { select: { id: true, role: true } },
          receiver: { select: { id: true, role: true } },
        },
      });

      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      const recipients = [userId, receiverId, ...admins.map(a => a.id)];
      recipients.forEach(rId => req.io?.to(`user_${rId}`).emit("newMessagePro", msg));

      const targetIds = [receiverId, ...admins.map(a => a.id)];
      for (const id of targetIds) {
        const counts = await prisma.messagePro.groupBy({
          by: ["senderId"],
          where: { receiverId: id, seen: false },
          _count: { senderId: true },
        });
        const countsMap = {};
        counts.forEach(item => countsMap[item.senderId] = item._count.senderId);
        req.io?.to(`user_${id}`).emit("unreadCountUpdated", countsMap);
      }

      return res.json(msg);
    }


      // ---------- CANDIDAT ----------
      if (userRole === "CANDIDAT") {
        const candidate = await prisma.user.findUnique({
          where: { id: userId },
          select: { assignedAgentId: true },
        });

        // 🧠 Identifier l’agent assigné (ou pas)
        const assignedAgentId = candidate.assignedAgentId;

        // 🔍 Trouver un admin de secours pour Prisma
        const admin = await prisma.user.findFirst({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        if (!admin) {
          return res.status(500).json({ error: "Aucun admin trouvé pour recevoir le message." });
        }

        // ✅ Créer le message avec un receiverId valide (agent assigné sinon admin)
        const receiverIdFinal = assignedAgentId || admin.id;

        const msg = await prisma.messagePro.create({
          data: {
            senderId: userId,
            receiverId: receiverIdFinal,
            content,
          },
        });

        // 👥 Déterminer les destinataires socket
        let recipients = [];

        if (assignedAgentId) {
          // Si le candidat a un agent → agent + tous les admins
          const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
          });
          recipients = [assignedAgentId, ...admins.map(a => a.id)];
        } else {
          // Si pas encore assigné → tous les agents + tous les admins
          const staff = await prisma.user.findMany({
            where: { role: { in: ["AGENT", "ADMIN"] } },
            select: { id: true },
          });
          recipients = staff.map(s => s.id);
        }

        // 📡 Envoyer le message à tous les destinataires + au candidat
        recipients.forEach(rId => req.io?.to(`user_${rId}`).emit("newMessagePro", msg));
        req.io?.to(`user_${userId}`).emit("newMessage", msg);

        // 🔥 Recalculer et émettre les compteurs pour chaque staff concerné
        for (const id of recipients) {
          const counts = await prisma.messagePro.groupBy({
            by: ["senderId"],
            where: { receiverId: id, seen: false },
            _count: { senderId: true },
          });

          const countsMap = {};
          counts.forEach(item => (countsMap[item.senderId] = item._count.senderId));

          req.io?.to(`user_${id}`).emit("unreadCountUpdated", countsMap);
        }

        // ✅ Retourner le message
        return res.json(msg);
      }



    return res.status(403).json({ error: "Rôle non autorisé." });
  } catch (err) {
    console.error("sendMessagePro err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



/**
 * getUnreadCountsPro
 */
exports.getUnreadCountsPro = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log("🟢 getUnreadCountsPro appelé par:", userRole, userId);

    let messages = [];

    if (userRole === "ADMIN") {
      // 🧠 L'admin voit tous les messages non lus envoyés par candidats ou agents
      messages = await prisma.messagePro.findMany({
        where: {
          seen: false,
          sender: {
            role: { in: ["CANDIDAT", "AGENT"] },
          },
        },
        select: { senderId: true },
      });
    } else if (userRole === "AGENT") {
      // L’agent voit uniquement les messages non lus qui lui sont adressés
      messages = await prisma.messagePro.findMany({
        where: {
          receiverId: userId,
          seen: false,
        },
        select: { senderId: true },
      });
    } else if (userRole === "CANDIDAT") {
      // Le candidat voit uniquement les messages non lus qui lui sont adressés
      messages = await prisma.messagePro.findMany({
        where: {
          receiverId: userId,
          seen: false,
        },
        select: { senderId: true },
      });
    }

    // 🧮 Regrouper les messages par senderId
    const countsMap = {};
    messages.forEach((m) => {
      countsMap[m.senderId] = (countsMap[m.senderId] || 0) + 1;
    });

    return res.json(countsMap);
  } catch (err) {
    console.error("getUnreadCountsPro err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


/**
 * markAsSeenPro
 */
exports.markAsSeenPro = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const friendId = parseInt(req.params.senderId || req.body.friendId);


    console.log("🟢 [markAsSeenPro] body reçu:", { userId, userRole, friendId });

    if (isNaN(friendId)) {
      return res.status(400).json({ message: "friendId invalide." });
    }

    let result;

    if (!friendId) {
      // 🟢 CAS CANDIDAT → marquer tous les messages reçus comme vus
      result = await prisma.messagePro.updateMany({
        where: {
          receiverId: userId,
          seen: false,
        },
        data: { seen: true },
      });
    } else if (userRole === "ADMIN") {
      // 🟢 CAS ADMIN → marquer les messages du candidat comme vus
      result = await prisma.messagePro.updateMany({
        where: {
          senderId: friendId,
          seen: false,
        },
        data: { seen: true },
      });
    } else {
      // 🟢 CAS AGENT → marquer les messages reçus du friendId comme vus
      result = await prisma.messagePro.updateMany({
        where: {
          senderId: friendId,
          receiverId: userId,
          seen: false,
        },
        data: { seen: true },
      });
    }

    console.log(`✅ ${result.count} messages marqués comme vus`);

    // 🔁 Socket.io : mettre à jour les compteurs
    if (req.io) {
      const usersToUpdate = [userId];

      if (userRole === "ADMIN") {
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN" },
          select: { id: true },
        });
        usersToUpdate.push(...admins.map((a) => a.id));
      }

      for (const uid of usersToUpdate) {
        const counts = await prisma.messagePro.groupBy({
          by: ["senderId"],
          where: { receiverId: uid, seen: false },
          _count: { senderId: true },
        });

        const countsMap = {};
        counts.forEach((c) => (countsMap[c.senderId] = c._count.senderId));
        req.io.to(`user_${uid}`).emit("unreadCountUpdated", countsMap);
      }
    }

    return res.status(200).json({
      message: "Messages marqués comme vus",
      updated: result.count,
    });
  } catch (error) {
    console.error("❌ Erreur markAsSeenPro:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};




/**
 * getLastMessagesPro
 * ==============================
 * - Les agents ne voient le lastMessage que pour les candidats non assignés
 * - Les agents assignés voient tout l'historique
 * - Les admins voient tout
 */
exports.getLastMessagesPro = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const messages = await prisma.messagePro.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, role: true, assignedAgentId: true } },
        receiver: { select: { id: true, role: true, assignedAgentId: true } },
      },
    });

    const lastMessagesMap = {};

    for (let m of messages) {
      const friend =
        m.senderId === userId ? m.receiver : m.sender;
      const friendId = friend.id;

      // ⚙️ On garde seulement le dernier message unique
      if (lastMessagesMap[friendId]) continue;

      // ⚡ Règle d'accès
      if (userRole === "AGENT" && friend.role === "CANDIDAT") {
        // Si assigné à un autre agent → cacher
        if (friend.assignedAgentId && friend.assignedAgentId !== userId)
          continue;
      }

      // Admin voit tout, agent voit ses candidats, candidats voient leurs messages
      if (
        userRole === "ADMIN" ||
        (userRole === "AGENT" &&
          (!friend.assignedAgentId || friend.assignedAgentId === userId)) ||
        (userRole === "CANDIDAT" &&
          (m.senderId === userId || m.receiverId === userId))
      ) {
        lastMessagesMap[friendId] = {
          content: m.content,
          createdAt: m.createdAt,
        };
      }
    }

    res.json(lastMessagesMap);
  } catch (err) {
    console.error("getLastMessagesPro err", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

/**
* ✅ getMyMessagesPro (corrigé)
 * Renvoie tous les messages envoyés OU reçus par le candidat (ou tout user)
 */
exports.getMyMessagesPro = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await prisma.messagePro.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("getMyMessagesPro err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

/**
 * ✅ getInboxPro (simplifié et corrigé)
 */
exports.getInboxPro = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await prisma.messagePro.findMany({
      where: {
        receiverId: userId,
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("getInboxPro err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
