const multer = require("multer");
const path = require("path");
const fs = require("fs");

// dossier de destination
const uploadDir = path.join(__dirname, "../../uploads/banners");

// création du dossier si inexistant
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Seules les images sont autorisées"), false);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
