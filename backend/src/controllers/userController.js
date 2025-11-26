const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

// === PROFIL ===
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    res.json({
      ...user,
      photoUrl: user.photo || null, // 🔥 Cloudinary direct
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// === PHOTO ===
exports.updatePhoto = async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: "URL de l'image manquante" });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { photo: photoUrl },
    });

    res.json(user);
  } catch (err) {
    console.error("❌ Erreur updatePhoto (Cloudinary):", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


// === LISTE DES USERS (ADMIN/AGENT) ===
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nom: true,
        postnom: true,
        prenom: true,
        email: true,
        tel: true,
        adresse: true,
        photo: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    const withPhotoUrl = users.map((u) => ({
      ...u,
      photoUrl: u.photo || null,
    }));

    res.json(withPhotoUrl);
  } catch (err) {
    console.error("❌ Erreur getAllUsers:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// === Vérification mot de passe admin ===
async function verifyAdminPassword(adminId, password) {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) throw new Error("Admin introuvable");

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) throw new Error("Mot de passe incorrect");

  return true;
}

// === CHANGER RÔLE ===
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role, password } = req.body;

  try {
    await verifyAdminPassword(req.user.id, password);

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role: role.toUpperCase() },
    });
    res.json(updated);
  } catch (err) {
    console.error("❌ Erreur updateUserRole:", err);
    res.status(400).json({ error: err.message || "Erreur modification rôle" });
  }
};

// === ACTIVER / DÉSACTIVER ===
exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { active, password } = req.body;

  try {
    await verifyAdminPassword(req.user.id, password);

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { active },
    });
    res.json(updated);
  } catch (err) {
    console.error("❌ Erreur updateUserStatus:", err);
    res.status(400).json({ error: err.message || "Erreur mise à jour statut" });
  }
};

// === SUPPRIMER USER ===
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    await verifyAdminPassword(req.user.id, password);

    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (err) {
    console.error("❌ Erreur deleteUser:", err);
    res.status(400).json({ error: err.message || "Erreur suppression utilisateur" });
  }
};

// === GET USER BY ID (ADMIN)
exports.getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    res.json({
      ...user,
      photoUrl: user.photo || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};