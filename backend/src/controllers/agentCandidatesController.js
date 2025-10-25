const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Récupérer les candidats assignés à l'agent connecté
exports.getAssignedCandidates = async (req, res) => {
  try {
    const agentId = req.user.id;

    const candidates = await prisma.user.findMany({
      where: {
        role: "CANDIDAT",
        assignedAgentId: agentId,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        assignedAgentId: true,
        createdAt: true,
      },
    });

    res.json(candidates);
  } catch (err) {
    console.error("getAssignedCandidates err", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Récupérer les candidats non encore assignés
exports.getUnassignedCandidates = async (req, res) => {
  try {
    const candidates = await prisma.user.findMany({
      where: {
        role: "CANDIDAT",
        assignedAgentId: null,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        createdAt: true,
      },
    });

    res.json(candidates);
  } catch (err) {
    console.error("getUnassignedCandidates err", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
