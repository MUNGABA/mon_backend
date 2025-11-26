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
const { ROLES } = require("../utils/roles");
const upload = require("../config/upload.js");

// === PROFIL UTILISATEUR ===
router.get("/me", auth(), getProfile);

// === ADMIN : gestion utilisateurs ===
router.get("/", auth([ROLES.ADMIN]), getAllUsers);
router.put("/:id/role", auth([ROLES.ADMIN]), updateUserRole);
router.put("/:id/status", auth([ROLES.ADMIN]), updateUserStatus);
router.delete("/:id", auth([ROLES.ADMIN]), deleteUser);
router.get("/:id", auth([ROLES.ADMIN, ROLES.AGENT]), getUserById);

// === PHOTO DE PROFIL ===
// ❗ Maintenant, Cloudinary gère déjà l'upload, ici on enregistre juste l'URL
router.put("/me/photo", auth(), updatePhoto);


module.exports = router;
