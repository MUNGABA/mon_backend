// routes/friendshipRoutes.js
const express = require("express");
const router = express.Router();
const { requireCandidat } = require("../middlewares/auth");
const controller = require("../controllers/friendshipController");

// Envoyer une demande
router.post("/send", requireCandidat, controller.sendRequest);

// Répondre à une demande
router.post("/respond", requireCandidat, controller.respondRequest);

// Refuser une demande (optionnel, endpoint dédié)
router.post("/reject", requireCandidat, controller.rejectRequest);

// Annuler une demande envoyée
router.post("/cancel", requireCandidat, controller.cancelRequest);

// Retirer un ami
router.post("/remove", requireCandidat, controller.removeFriend);

// Liste des amis
router.get("/friends", requireCandidat, controller.getFriends);

// Suggestions d’amis
router.get("/suggestions", requireCandidat, controller.getSuggestions);

module.exports = router;
