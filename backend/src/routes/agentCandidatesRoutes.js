const express = require("express");
const router = express.Router();
const { requireAgent } = require("../middlewares/auth");
const ctrl = require("../controllers/agentCandidatesController");

// 🔹 Récupérer les candidats assignés à l'agent connecté
router.get("/assigned", requireAgent, ctrl.getAssignedCandidates);

// 🔹 Récupérer les candidats non encore assignés
router.get("/unassigned", requireAgent, ctrl.getUnassignedCandidates);

module.exports = router;
