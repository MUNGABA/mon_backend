const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Ajouter une ou plusieurs bannières
exports.addBanner = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Aucune image reçue" });
    }

    // Créer un enregistrement pour chaque image
    const banners = await Promise.all(
      req.files.map((file) =>
        prisma.banner.create({
          data: { image: file.filename },
        })
      )
    );

    res.json(banners);
  } catch (error) {
    console.error("Erreur addBanner:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Récupérer toutes les bannières
exports.getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(banners);
  } catch (error) {
    console.error("Erreur getBanners:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// ✅ Supprimer une bannière
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id: Number(id) } });
    res.json({ message: "Bannière supprimée" });
  } catch (error) {
    console.error("Erreur deleteBanner:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
