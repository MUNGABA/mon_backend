// middlewares/uploadUserPhoto.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Dossier dans lequel tu veux stocker les photos => /uploads/
const uploadDir = path.join(__dirname, "../../uploads");

// ✅ Créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Seules les images sont autorisées"), false);
};

module.exports = multer({ storage, fileFilter });
