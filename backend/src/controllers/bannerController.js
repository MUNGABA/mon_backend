const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Ajouter une ou plusieurs bannières
// Ajouter des bannières (URLs Cloudinary)
exports.addBanner = async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "Aucune URL fournie" });
    }

    const banners = await Promise.all(
      urls.map((url) =>
        prisma.banner.create({
          data: { image: url },
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
