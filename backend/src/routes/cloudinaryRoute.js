const express = require("express");
const upload = require("../config/upload.js");
const { uploadFichier } = require("../controllers/cloudinaryController.js");

const router = express.Router(); // ✅ Bien express.Router()

router.post("/upload", upload.single("image"), uploadFichier); // "image" = nom du champ côté front

module.exports = router;
