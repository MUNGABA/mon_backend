const express = require("express");
const upload = require("../config/upload.js");
const { uploadFichier } = require("../controllers/cloudinaryController.js");

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFichier);

module.exports = router;
