// src/api/middlewares/auth.js
const jwt = require("jsonwebtoken");
const { ROLES } = require("../utils/roles");

// ✅ Middleware générique avec restriction par rôle(s)
const auth = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Token manquant" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      // Vérifie si l'utilisateur a le bon rôle
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Accès refusé: rôle non autorisé" });
      }

      next();
    } catch (error) {
      console.error("Erreur auth middleware:", error);
      return res.status(401).json({ error: "Token invalide" });
    }
  };
};

// ✅ Helpers spécifiques pour simplifier
const requireAdmin = auth([ROLES.ADMIN]);
const requireAgent = auth([ROLES.AGENT]);
const requireCandidat = auth([ROLES.CANDIDAT]);

module.exports = { auth, requireAdmin, requireAgent, requireCandidat };
