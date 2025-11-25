const uploadFichier = async (req, res) => {
  try {
    console.log("req.file:", req.file); // <-- pour debug

    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    return res.json({
      message: "Upload réussi",
      url: req.file.path,
      public_id: req.file.filename,
    });
  } catch (err) {
    console.error("Erreur upload Cloudinary :", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
