const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ 1️⃣ Voir tous les agents + leurs candidats assignés
exports.getAgentsWithCandidates = async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: { role: "AGENT" },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        assignedCandidates: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    res.json(agents);
  } catch (err) {
    console.error("getAgentsWithCandidates err", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ 2️⃣ Voir les candidats non encore assignés
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
    console.error("getUnassignedCandidates (admin) err", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
