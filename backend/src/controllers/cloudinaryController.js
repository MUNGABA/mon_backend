export const uploadFichier = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });

    return res.json({
      message: "Upload réussi",
      url: req.file.path,        // ➜ URL Cloudinary
      public_id: req.file.filename,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
