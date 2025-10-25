const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middlewares/auth");
const ctrl = require("../controllers/adminCandidatesController");

// 🔹 Voir tous les agents avec leurs candidats assignés
router.get("/agents", requireAdmin, ctrl.getAgentsWithCandidates);

// 🔹 Voir les candidats non assignés
router.get("/unassigned", requireAdmin, ctrl.getUnassignedCandidates);

module.exports = router;
