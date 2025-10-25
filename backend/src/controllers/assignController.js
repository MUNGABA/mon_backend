// controllers/assignController.js
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// On injectera l'instance io (depuis app.js)
let ioInstance = null;
exports.injectSocket = (io) => {
  ioInstance = io;
};

exports.assignCandidate = async (req, res) => {
  try {
    const agentId = req.user.id;
    const { candidateId, password } = req.body;

    // 🧩 Vérifications de base
    if (!candidateId || !password)
      return res.status(400).json({ error: "candidateId et password requis" });

    if (req.user.role !== "AGENT")
      return res.status(403).json({ error: "Non autorisé" });

    // 🧠 Vérifier agent & candidat
    const agent = await prisma.user.findUnique({ where: { id: agentId } });
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      include: { assignedAgent: { select: { id: true, nom: true } } },
    });

    if (!agent) return res.status(404).json({ error: "Agent introuvable" });
    if (!candidate)
      return res.status(404).json({ error: "Candidat introuvable" });

    if (candidate.assignedAgentId)
      return res.status(400).json({
        error: `Candidat déjà assigné à ${
          candidate.assignedAgent?.nom || "un autre agent"
        }`,
      });

    // 🔐 Vérification mot de passe
    const validPassword = await bcrypt.compare(password, agent.password);
    if (!validPassword)
      return res.status(401).json({ error: "Mot de passe incorrect" });

    // ✅ Mise à jour
    const updated = await prisma.user.update({
      where: { id: candidateId },
      data: { assignedAgentId: agentId },
      include: {
        assignedAgent: { select: { id: true, nom: true } },
      },
    });

    // 🔹 Récupérer tous les candidats après mise à jour
    const candidates = await prisma.user.findMany({
      where: { role: "CANDIDAT" },
      include: {
        assignedAgent: { select: { id: true, nom: true } },
      },
    });

    // ⚡ Émission socket (notifier tous les agents)
    if (ioInstance) {
      ioInstance.emit("candidateAssigned", {
        candidateId: updated.id,
        assignedAgent: updated.assignedAgent,
      });
    }

    return res.json({
      success: true,
      assignedAgentId: updated.assignedAgentId,
      assignedAgent: updated.assignedAgent,
    });
  } catch (err) {
    console.error("❌ assignCandidate err:", err);
    res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
};
