const express = require("express");
const router = express.Router();
const { requireCandidat } = require("../middlewares/auth"); // ou auth général
const ctrl = require("../controllers/messageController");
const { getLastMessages } = require("../controllers/messageController");

router.get("/last", requireCandidat, getLastMessages);
router.get("/:friendId", requireCandidat, ctrl.getConversation); // GET conversation
router.post("/", requireCandidat, ctrl.sendMessage); // POST send
router.get("/unread/counts", requireCandidat, ctrl.getUnreadCounts);
router.put("/seen", requireCandidat, ctrl.markAsSeen);



module.exports = router;
