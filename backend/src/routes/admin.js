const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { requireAdmin, requireAgent, auth } = require("../middlewares/auth"); // ✅ ajout de auth
const { ROLES } = require("../utils/roles"); // ✅ ajout de ROLES

const prisma = new PrismaClient();
const router = express.Router();

// ====================
// 🔐 Middleware de vérification admin
// ====================
async function verifyAdmin(req, res, next) {
  const { adminEmail, password } = req.body;

  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return res.status(403).json({ message: "Accès interdit (admin requis)" });
    }

    const isValid = await bcrypt.compare(password, adminUser.password);
    if (!isValid) {
      return res.status(403).json({ message: "Mot de passe invalide" });
    }

    req.adminUser = adminUser;
    next();
  } catch (err) {
    console.error("Erreur vérification admin:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ====================
// 🚀 Supprimer un utilisateur
// ====================
router.post("/delete", verifyAdmin, async (req, res) => {
  const { userId } = req.body;
  const { adminUser } = req;

  try {
    if (adminUser.id === userId) {
      return res
        .status(400)
        .json({ message: "Impossible de supprimer son propre compte" });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("Erreur suppression admin:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ====================
// 🚀 Promouvoir un utilisateur (Agent ou Admin)
// ====================
router.post("/promote", verifyAdmin, async (req, res) => {
  const { userId, role } = req.body;

  try {
    if (!["AGENT", "ADMIN"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    res.json({
      message: `✅ Utilisateur promu en ${role}`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Erreur promotion admin:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🚀 Tous les utilisateurs (ADMIN seulement)
router.get("/users/all", requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    console.error("Erreur récupération utilisateurs:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 🚀 Candidats (ADMIN ou AGENT)
router.get("/users/candidats", auth([ROLES.ADMIN, ROLES.AGENT]), async (req, res) => {
  try {
    const candidats = await prisma.user.findMany({
      where: { role: "CANDIDAT" },
      orderBy: { createdAt: "desc" },
      include: {
        assignedAgent: {
          select: { id: true, nom: true, email: true },
        },
      },
    });

    // Nettoyage des données et ajout de l'URL photo
    const candidatsWithPhotoUrl = candidats.map((u) => ({
      id: u.id,
      nom: u.nom,
      postnom: u.postnom,
      prenom: u.prenom,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      candidatureStatus: u.candidatureStatus,
      assignedAgentId: u.assignedAgentId,
      assignedAgent: u.assignedAgent,
      photoUrl: u.photo
        ? `${req.protocol}://${req.get("host")}/uploads/${u.photo}`
        : "/default-avatar.png",
    }));

    res.json(candidatsWithPhotoUrl);
  } catch (err) {
    console.error("Erreur récupération candidats:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


module.exports = router;
