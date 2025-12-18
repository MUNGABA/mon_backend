// routes/friendshipRoutes.js
const express = require("express");
const router = express.Router();
const { requireCandidat } = require("../middlewares/auth");
const controller = require("../controllers/friendshipController");

// Envoyer une demande
router.post("/send", requireCandidat, controller.sendRequest);

// Répondre (accepter/refuser)
router.post("/respond", requireCandidat, controller.respondRequest);

// Refuser explicitement
router.post("/reject", requireCandidat, controller.rejectRequest);

// Annuler une demande envoyée
router.post("/cancel", requireCandidat, controller.cancelRequest);

// Retirer un ami
router.post("/remove", requireCandidat, controller.removeFriend);

// Invitations reçues
router.get("/received", requireCandidat, controller.getReceivedRequests);

// Liste des amis
router.get("/friends", requireCandidat, controller.getFriends);

// Suggestions d’amis
router.get("/suggestions", requireCandidat, controller.getSuggestions);

module.exports = router;
  