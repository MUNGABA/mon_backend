const express = require("express");
const router = express.Router();
const { addBanner, getBanners, deleteBanner } = require("../controllers/bannerController");
const upload = require("../middlewares/upload");
const { auth } = require("../middlewares/auth");
const { ROLES } = require("../utils/roles");

/**
 * ===========================
 * 🖼️ ROUTES DES BANNIÈRES
 * ===========================
 */

// ✅ Ajouter une ou plusieurs bannières (ADMIN)
router.post("/", auth([ROLES.ADMIN]), addBanner);

// ✅ Récupérer toutes les bannières (tout le monde)
router.get("/", getBanners);

// ✅ Supprimer une bannière (ADMIN)
router.delete("/:id", auth([ROLES.ADMIN]), deleteBanner);

module.exports = router;
