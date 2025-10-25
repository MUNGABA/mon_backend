// controllers/friendshipController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Envoyer une demande d’amitié
 */
exports.sendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { receiverId } = req.body;

    if (requesterId === receiverId)
      return res.status(400).json({ message: "Impossible de s’ajouter soi-même." });

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    });

    if (existing)
      return res.status(400).json({ message: "Demande déjà existante." });

    const friendship = await prisma.friendship.create({
      data: { requesterId, receiverId },
    });

    res.json(friendship);
  } catch (error) {
    console.error("Erreur sendRequest:", error);
    res.status(500).json({ message: "Erreur lors de l’envoi de la demande." });
  }
};

/**
 * accepter à une demande d’amitié
 */
exports.respondRequest = async (req, res) => {
  try {
    const { friendshipId, response } = req.body; // ACCEPTED | REFUSED

    const friendship = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: response },
    });

    res.json(friendship);
  } catch (error) {
    console.error("Erreur respondRequest:", error);
    res.status(500).json({ message: "Erreur lors de la réponse à la demande." });
  }
};

/**
 * Refuser une demande d’amitié
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { friendshipId } = req.body;

    // Supprime la relation PENDING
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    res.json({ message: "Demande refusée." });
  } catch (error) {
    console.error("Erreur rejectRequest:", error);
    res.status(500).json({ message: "Erreur lors du refus de la demande." });
  }
};

/**
 * Annuler une demande envoyée
 */
exports.cancelRequest = async (req, res) => {
  try {
    const { friendshipId } = req.body;

    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    res.json({ message: "Demande annulée." });
  } catch (error) {
    console.error("Erreur cancelRequest:", error);
    res.status(500).json({ message: "Erreur lors de l’annulation." });
  }
};

/**
 * Liste des amis (ACCEPTED)
 */
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: true,
        receiver: true,
      },
    });

    const friends = friendships.map((f) =>
      f.requesterId === userId ? f.receiver : f.requester
    );

    res.json(friends);
  } catch (error) {
    console.error("Erreur getFriends:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des amis." });
  }
};

/**
 * Suggestions d’amis
 */
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔹 Récupère toutes les relations impliquant l'utilisateur
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId },
        ],
      },
    });

    // 🔸 Liste des relations acceptées (amis à exclure)
    const accepted = friendships.filter((f) => f.status === "ACCEPTED");
    const excludedIds = new Set(
      accepted.flatMap((f) => [f.requesterId, f.receiverId])
    );
    excludedIds.add(userId);

    // 🔹 Trouve tous les candidats actifs non amis
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludedIds) },
        role: "CANDIDAT",
        active: true,
      },
      select: {
        id: true,
        nom: true,
        postnom: true,
        prenom: true,
        email: true,
        photo: true,
      },
    });

    // 🔹 Marquer chaque utilisateur selon le statut de relation
    const formatted = users.map((u) => {
      const relation = friendships.find(
        (f) =>
          (f.requesterId === userId && f.receiverId === u.id) ||
          (f.receiverId === userId && f.requesterId === u.id)
      );

     return {
        ...u,
        // ✅ Chemin complet pour afficher la photo
        photoUrl: u.photo
          ? `${req.protocol}://${req.get("host")}/uploads/${u.photo}`
          : null,
        hasPendingRequest:
          relation?.status === "PENDING" && relation?.requesterId === userId,
        hasSentRequestToMe:
          relation?.status === "PENDING" && relation?.receiverId === userId,
        friendshipId: relation?.id || null,
      };
    });

    // 🔝 Trier : ceux qui m’ont envoyé une demande d’abord
    const sorted = formatted.sort((a, b) => {
      if (a.hasSentRequestToMe && !b.hasSentRequestToMe) return -1;
      if (!a.hasSentRequestToMe && b.hasSentRequestToMe) return 1;
      return 0;
    });

    res.json(sorted);
  } catch (error) {
    console.error("Erreur getSuggestions:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des suggestions." });
  }
};

/**
 * Retirer un ami (supprimer la relation ACCEPTED)
 */
exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body;

    // Vérifie s’il existe une relation entre userId et friendId
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: friendId, status: "ACCEPTED" },
          { requesterId: friendId, receiverId: userId, status: "ACCEPTED" },
        ],
      },
    });

    if (!friendship)
      return res.status(404).json({ message: "Cette amitié n’existe pas." });

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    res.json({ message: "Ami retiré avec succès." });
  } catch (error) {
    console.error("Erreur removeFriend:", error);
    res.status(500).json({ message: "Erreur lors du retrait de l’ami." });
  }
};
