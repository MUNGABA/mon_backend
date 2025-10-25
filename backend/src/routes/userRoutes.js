const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  updatePhoto,
  getAllUsers,
  getUserById,
} = require("../controllers/userController");
const { auth } = require("../middlewares/auth");
const uploadUserPhoto = require("../middlewares/uploadUserPhoto");
const { ROLES } = require("../utils/roles");

// === PROFIL UTILISATEUR ===
router.get("/me", auth(), getProfile);

// === ADMIN : gestion utilisateurs ===
router.get("/", auth([ROLES.ADMIN]), getAllUsers);            // 🔹 liste complète
router.put("/:id/role", auth([ROLES.ADMIN]), updateUserRole); // 🔹 changer rôle
router.put("/:id/status", auth([ROLES.ADMIN]), updateUserStatus); // 🔹 activer/désactiver
router.delete("/:id", auth([ROLES.ADMIN]), deleteUser);       // 🔹 supprimer user
// Admin récupère un utilisateur par ID
router.get("/:id", auth([ROLES.ADMIN, ROLES.AGENT]), getUserById);

// === PHOTO DE PROFIL ===
router.put("/me/photo", auth(), uploadUserPhoto.single("photo"), updatePhoto);

module.exports = router;
