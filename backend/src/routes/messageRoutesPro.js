const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const ctrl = require("../controllers/messageControllerPro");
const restrictToCandidateContext = require("../middlewares/restrictToCandidateContext");

router.use(auth()); // Auth obligatoire
router.use(restrictToCandidateContext); // 🔒 Restreint toutes les routes de ce dossier

// Routes spécifiques d’abord ⚠️
router.get("/last", auth([]), ctrl.getLastMessagesPro);
router.get("/unread/counts", auth([]), ctrl.getUnreadCountsPro);
router.put("/seen", auth([]), ctrl.markAsSeenPro);
router.put("/seen/:senderId", auth([]), ctrl.markAsSeenPro);
router.get("/me", auth([]), ctrl.getMyMessagesPro);

// Puis les routes dynamiques
router.get("/inbox", auth([]), ctrl.getInboxPro);
router.get("/:friendId", auth([]), ctrl.getConversationPro);
router.post("/", auth([]), ctrl.sendMessagePro);


module.exports = router;
