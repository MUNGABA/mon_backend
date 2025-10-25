const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { getIO } = require("../socket");
const notificationController = require("./notificationController");

// ----------------------------
// 1️⃣ CANDIDAT POSTULE
// ----------------------------
exports.applyCompetition = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Mot de passe requis" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Mot de passe incorrect" });

    if (user.candidatureStatus !== "NON_POSTULE") {
      return res.status(400).json({ error: "Candidature déjà en cours" });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { candidatureStatus: "EN_ATTENTE" },
    });

    const io = getIO();

    // Notification pour Admin + Agent
    const payload = {
      actorName: `${user.nom} ${user.prenom}`,
      actorRole: "CANDIDAT",
      action: "a postulé",
      candidateId: updated.id,
    };
    io.to("admins").emit("notification", payload);
    io.to("agents").emit("notification", payload);
    io.to(`user_${user.id}`).emit("notification", { action: "Votre candidature a été soumise" });

    res.json({ message: "Candidature soumise avec succès", user: updated });
  } catch (err) {
    console.error("applyCompetition error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ----------------------------
// 2️⃣ AGENT PREND DECISION
// ----------------------------
exports.agentDecision = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { candidateId } = req.params;
    const { decision, password } = req.body;

    if (!["ACCEPTE", "REFUSE"].includes(decision)) return res.status(400).json({ error: "Décision invalide" });
    if (!password) return res.status(400).json({ error: "Mot de passe requis" });

    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    const candidate = await prisma.user.findUnique({ where: { id: Number(candidateId) } });

    if (!agent || !candidate) return res.status(404).json({ error: "Utilisateur introuvable" });

    const ok = await bcrypt.compare(password, agent.password);
    if (!ok) return res.status(401).json({ error: "Mot de passe incorrect" });

    const updated = await prisma.user.update({
      where: { id: Number(candidateId) },
      data: { candidatureStatus: decision },
    });

    const io = getIO();
    const message = `${decision === "ACCEPTE" ? "accepté" : "refusé"}`;

    // 🟢 Notification pour ADMIN + AGENT
  await notificationController.sendNotification({
    body: {
    message: `Agent ${agent.nom} ${agent.prenom} a ${message} la candidature de ${candidate.nom} ${candidate.prenom}`,
    targetRole: "ADMIN",
   },
    io: req.io, // important pour le temps réel
  });

  // 🟢 Notification pour le CANDIDAT
  await notificationController.sendNotification({
    body: {
      message: `Votre candidature a été ${message}`,
      userIds: [candidate.id],
    },
    io: req.io,
  });
      
    res.json({ message: `Décision ${decision} appliquée`, candidate: updated });
  } catch (err) {
    console.error("agentDecision error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ----------------------------
// 3️⃣ ADMIN PREND DECISION
// ----------------------------
exports.adminDecision = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { candidateId } = req.params;
    const { decision, password } = req.body;

    if (!["ACCEPTE", "REFUSE"].includes(decision)) return res.status(400).json({ error: "Décision invalide" });
    if (!password) return res.status(400).json({ error: "Mot de passe requis" });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    const candidate = await prisma.user.findUnique({ where: { id: Number(candidateId) } });

    if (!admin || !candidate) return res.status(404).json({ error: "Utilisateur introuvable" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: "Mot de passe incorrect" });

    const updated = await prisma.user.update({
      where: { id: Number(candidateId) },
      data: { candidatureStatus: decision },
    });

    const io = getIO();
    const message = `${decision === "ACCEPTE" ? "accepté" : "refusé"}`;
    
    // 🟢 Notifier les agents et admins
  await notificationController.sendNotification({
    body: {
      message: `Admin ${admin.nom} ${admin.prenom} a ${message} la candidature de ${candidate.nom} ${candidate.prenom}`,
      targetRole: "AGENT",
    },
    io: req.io,
  });

  // 🟢 Notifier le candidat
  await notificationController.sendNotification({
    body: {
      message: `Votre candidature a été ${message}`,
      userIds: [candidate.id],
    },
    io: req.io,
  });
    
    res.json({ message: `Décision ${decision} appliquée`, candidate: updated });
  } catch (err) {
    console.error("adminDecision error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ----------------------------
// 4️⃣ ADMIN ANNULE DECISION
// ----------------------------
exports.adminCancelDecision = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { candidateId } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ error: "Mot de passe requis" });

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    const candidate = await prisma.user.findUnique({ where: { id: Number(candidateId) } });

    if (!admin || !candidate) return res.status(404).json({ error: "Utilisateur introuvable" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) return res.status(401).json({ error: "Mot de passe incorrect" });

    const updated = await prisma.user.update({
      where: { id: Number(candidateId) },
      data: { candidatureStatus: "NON_POSTULE" },
    });

        await notificationController.sendNotification({
      body: {
        message: `Admin ${admin.nom} ${admin.prenom} a annulé la décision Candidat ${candidate.nom} ${candidate.prenom}`,
        targetRole: "AGENT",
      },
      io: req.io,
    });

    await notificationController.sendNotification({
      body: {
        message: "Votre candidature a été réinitialisée, vous pouvez ressayé plus tard",
        userIds: [candidate.id],
      },
      io: req.io,
    });

    res.json({ message: "Décision annulée", candidate: updated });
  } catch (err) {
    console.error("adminCancelDecision error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
