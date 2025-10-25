const express = require("express");
const {
  sendNotification,
  getNotifications,
  markAsSeen,
  deleteForMe,
  deleteGlobal,
  getViews,
} = require("../controllers/notificationController");
const { auth } = require("../middlewares/auth");
const { ROLES } = require("../utils/roles");

const router = express.Router();

// Créer une notif (admin ou agent)
router.post("/send", auth([ROLES.ADMIN, ROLES.AGENT, ROLES.CANDIDAT]), sendNotification);

// Récupérer mes notifs
router.get("/me", auth(), getNotifications);

// Marquer comme vues
router.put("/seen", auth(), markAsSeen);

// Supprimer pour moi
router.delete("/:id", auth(), deleteForMe);

// Supprimer globalement (admin)
router.delete("/:id/admin", auth([ROLES.ADMIN]), deleteGlobal);

// Vu par (admin)
router.get("/:id/views", auth([ROLES.ADMIN]), getViews);

module.exports = router;
