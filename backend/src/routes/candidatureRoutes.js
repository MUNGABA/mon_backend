// src/routes/candidatureRoutes.js
const express = require("express");
const {
  applyCompetition,
  agentDecision,
  adminDecision,
  adminCancelDecision,
} = require("../controllers/candidatureController");
const { auth } = require("../middlewares/auth");
const { ROLES } = require("../utils/roles");

const router = express.Router();

// Candidat postule (nécessite auth)
router.put("/me/apply", auth([ROLES.CANDIDAT]), applyCompetition);

// Agent prend une décision sur un candidat
router.put("/agent/:candidateId/decision", auth([ROLES.AGENT]), agentDecision);

// Admin prend une décision (optionnel, similaire à agent)
router.put("/admin/:candidateId/decision", auth([ROLES.ADMIN]), adminDecision);

// Admin annule décision (remet à NON_POSTULE)
router.put("/admin/:candidateId/cancel", auth([ROLES.ADMIN]), adminCancelDecision);

module.exports = router;
