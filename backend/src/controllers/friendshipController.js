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
 * Répondre à une demande (ACCEPTER ou REFUSER)
 */
exports.respondRequest = async (req, res) => {
  try {
    const { friendshipId, accept } = req.body;

    if (!friendshipId)
      return res.status(400).json({ message: "friendshipId manquant." });

    if (accept) {
      const friendship = await prisma.friendship.update({
        where: { id: friendshipId },
        data: { status: "ACCEPTED" },
      });
      return res.json(friendship);
    }

    // Sinon refuser = suppression
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    res.json({ message: "Demande refusée." });
  } catch (error) {
    console.error("Erreur respondRequest:", error);
    res.status(500).json({ message: "Erreur lors de la réponse à la demande." });
  }
};

/**
 * Refuser une demande (endpoint séparé)
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { friendshipId } = req.body;

    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    res.json({ message: "Demande refusée." });
  } catch (error) {
    console.error("Erreur rejectRequest:", error);
    res.status(500).json({ message: "Erreur lors du refus." });
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
 * Retirer un ami
 */
exports.removeFriend = async (req, res) => {
  try {
    const { friendshipId } = req.body;

    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    res.json({ message: "Ami retiré." });
  } catch (error) {
    console.error("Erreur removeFriend:", error);
    res.status(500).json({ message: "Erreur lors du retrait." });
  }
};

/**
 * Liste des amis
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

    const friends = friendships.map((f) => {
    const friend =
        f.requesterId === userId ? f.receiver : f.requester;

      return {
        friendshipId: f.id, // 🔥 IMPORTANT
        id: friend.id,
        nom: friend.nom,
        postnom: friend.postnom,
        prenom: friend.prenom,
        photoUrl: friend.photo,
      };
    });

    res.json(friends);

  } catch (error) {
    console.error("Erreur getFriends:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des amis." });
  }
};

/**
 * Invitations reçues
 */
exports.getReceivedRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await prisma.friendship.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { requester: true },
    });

    const formatted = requests.map((r) => ({
      friendshipId: r.id,
      id: r.requester.id,
      nom: r.requester.nom,
      postnom: r.requester.postnom,
      prenom: r.requester.prenom,
      photoUrl: r.requester.photo,
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Erreur getReceivedRequests:", error);
    res.status(500).json({ message: "Erreur récupération des invitations." });
  }
};

/**
 * Suggestions d'amis
 */
exports.getSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
      },
    });

    const accepted = friendships.filter((f) => f.status === "ACCEPTED");
    const excludedIds = new Set(
      accepted.flatMap((f) => [f.requesterId, f.receiverId])
    );

    excludedIds.add(userId);

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
        photo: true,
      },
    });

    const formatted = users.map((u) => {
      const relation = friendships.find(
        (f) =>
          (f.requesterId === userId && f.receiverId === u.id) ||
          (f.receiverId === userId && f.requesterId === u.id)
      );

      return {
        ...u,
        photoUrl: u.photo,
        hasPendingRequest:
          relation?.status === "PENDING" && relation.requesterId === userId,
        hasSentRequestToMe:
          relation?.status === "PENDING" && relation.receiverId === userId,
        friendshipId: relation?.id || null,
      };
    });

    const sorted = formatted.sort((a, b) => {
      if (a.hasSentRequestToMe && !b.hasSentRequestToMe) return -1;
      if (!a.hasSentRequestToMe && b.hasSentRequestToMe) return 1;
      return 0;
    });

    res.json(sorted);
  } catch (error) {
    console.error("Erreur getSuggestions:", error);
    res.status(500).json({ message: "Erreur lors des suggestions." });
  }
};
