const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Création de notification selon rôle hiérarchique ou ciblée
exports.sendNotification = async (req, res = null) => {
  try {
    const { message, targetRole, userIds } = req.body;
    const io = req.io || req?.io || null;
    let users = [];

    // 🟢 Cas 1 : ciblage manuel (liste d'IDs)
    if (userIds && userIds.length > 0) {
      // destinataires spécifiques
      users = await prisma.user.findMany({
        where: { id: { in: userIds.map(Number) }, active: true },
      });

      // Ajout des admins pour supervision
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", active: true },
      });

      // fusion sans doublons
      const all = [...users, ...admins].filter(
        (v, i, a) => a.findIndex((t) => t.id === v.id) === i
      );
      users = all;
    }

    // 🟢 Cas 2 : ciblage par rôle (CANDIDAT / AGENT / ADMIN)
    else if (targetRole) {
      if (targetRole === "CANDIDAT") {
        users = await prisma.user.findMany({
          where: { role: { in: ["CANDIDAT", "AGENT", "ADMIN"] }, active: true },
        });
      } else if (targetRole === "AGENT") {
        users = await prisma.user.findMany({
          where: { role: { in: ["AGENT", "ADMIN"] }, active: true },
        });
      } else if (targetRole === "ADMIN") {
        users = await prisma.user.findMany({
          where: { role: "ADMIN", active: true },
        });
      }
    }

    // 🟢 Cas 3 : global (aucun role, aucun userIds)
    else {
      users = await prisma.user.findMany({ where: { active: true } });
    }

    // 🟢 Création de la notification
    const notif = await prisma.notification.create({
      data: {
        message,
        role: ["CANDIDAT", "AGENT", "ADMIN"].includes(targetRole)
          ? targetRole
          : null, // null = globale
        recipients: {
          create: users.map((u) => ({ userId: u.id })),
        },
      },
      include: { recipients: true },
    });

    // 🟢 Envoi temps réel si socket disponible
    if (req.io) {
  // 🔸 Émission ciblée (chaque user)
  users.forEach((u) => {
    req.io.emit(`notification_${u.id}`, {
      ...notif,
      targetRole: targetRole || (userIds?.length ? "CIBLEE" : "GLOBAL"),
    });
  });

  // 🔸 Émission groupée (par rôle)
  if (["ADMIN", "AGENT"].includes(targetRole)) {
    req.io.emit(`notification`, {
      id: notif.id,
      message: notif.message,
      createdAt: notif.createdAt,
      role: targetRole,
    });
  } else if (targetRole === "CANDIDAT") {
    req.io.emit(`notification_CANDIDAT`, {
      id: notif.id,
      message: notif.message,
      createdAt: notif.createdAt,
      role: targetRole,
    });
  }
}


  if (res) res.json(notif);
  return notif;
  } catch (err) {
    console.error("Erreur sendNotification:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


// ✅ Récupérer mes notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notificationRecipient.findMany({
      where: { userId: req.user.id },
      include: { notification: true },
      orderBy: [ 
        { notification: { createdAt: "desc" } },
        { id: "desc"} 
      ]
    });

    // Ajouter une mention lisible
    const withLabels = notifications.map((n) => ({
      ...n,
      label:
        n.notification.role === "CANDIDAT"
          ? "Notification destinée aux candidats"
          : n.notification.role === "AGENT"
          ? "Notification destinée aux agents"
          : n.notification.role === "ADMIN"
          ? "Notification destinée aux administrateurs"
          : "Notification générale",
    }));

    res.json(withLabels);
  } catch (err) {
    console.error("Erreur getNotifications:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Marquer comme lues
exports.markAsSeen = async (req, res) => {
  try {
    await prisma.notificationRecipient.updateMany({
      where: { userId: req.user.id, seen: false },
      data: { seen: true, seenAt: new Date() },
    });
    res.json({ message: "Notifications marquées comme lues" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Supprimer pour soi
exports.deleteForMe = async (req, res) => {
  try {
    await prisma.notificationRecipient.deleteMany({
      where: { userId: req.user.id, notificationId: Number(req.params.id) },
    });
    res.json({ message: "Notification supprimée pour vous" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Supprimer globalement (admin)
exports.deleteGlobal = async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { id: Number(req.params.id) },
    });
    res.json({ message: "Notification supprimée globalement" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Voir qui a lu (admin)
exports.getViews = async (req, res) => {
  try {
    const views = await prisma.notificationRecipient.findMany({
      where: { notificationId: Number(req.params.id) },
      include: { user: true },
    });
    res.json(views);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
