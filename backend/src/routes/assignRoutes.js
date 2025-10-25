const express = require("express");
const router = express.Router();
const { requireAgent } = require("../middlewares/auth");
const assignCtrl = require("../controllers/assignController");

router.post("/assign-candidate", requireAgent, assignCtrl.assignCandidate);

module.exports = router;
