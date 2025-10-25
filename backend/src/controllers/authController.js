const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { nom, postnom, prenom, tel, adresse, email, password } = req.body;

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return res.status(400).json({ error: "Email déjà utilisé" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { nom, postnom, prenom, tel, adresse, email, password: hashedPassword, role: "CANDIDAT" }
    });

    // ⚠️ Avant d’utiliser req.io, on vérifie qu’il existe
    if (req.io) {
      req.io.emit("newUser", {
        id: user.id,
        nom: user.nom,
        postnom: user.postnom,
        prenom: user.prenom,
        telephone: user.telephone,
        email: user.email,
        photoUrl: user.photoUrl || null,
      });
    }

    // ✅ Token direct après inscription
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Inscription réussie", token, user });

  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Utilisateur non trouvé" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (error) {
  console.error("❌ ERREUR LOGIN:", error);
  res.status(500).json({ error: error.message || "Erreur serveur" });
}

};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès interdit (admin requis)" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Mot de passe incorrect" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user });
  } catch (error) {
    console.error("Erreur connexion admin:", error);
    res.status(500).json({ error: "Erreur serveur" });
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
