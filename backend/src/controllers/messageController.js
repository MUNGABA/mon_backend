// controllers/messageController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = Number(req.params.friendId);

    if (isNaN(friendId)) {
      return res.status(400).json({ error: "friendId invalide" });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error("getConversation err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    const message = await prisma.message.create({
      data: { senderId, receiverId: Number(receiverId), content },
    });

    // Émettre via socket si disponible (req.io)
    if (req.io) {
      const room = [senderId, Number(receiverId)].sort().join("-");
      req.io.to(room).emit("newMessage", { ...message, room });
    }

    res.json(message);
  } catch (err) {
    console.error("sendMessage err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const counts = await prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: userId, seen: false },
      _count: { senderId: true },
    });

    // Transformer en map { friendId: count }
    const countsMap = {};
    counts.forEach((item) => {
      countsMap[item.senderId] = item._count.senderId;
    });

    res.json(countsMap);
  } catch (err) {
    console.error("getUnreadCounts err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.body; // qui a envoyé les messages

    await prisma.message.updateMany({
      where: {
        senderId: Number(friendId),
        receiverId: userId,
        seen: false,
      },
      data: { seen: true },
    });

    res.json({ success: true });
  } catch (err) {
    console.error("markAsSeen err", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getLastMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
    });

    // Map des derniers messages par ami
    const lastMessagesMap = {};
    messages.forEach((m) => {
      const friendId = m.senderId === userId ? m.receiverId : m.senderId;
      if (!lastMessagesMap[friendId]) {
        lastMessagesMap[friendId] = {
          content: m.content,
          createdAt: m.createdAt,
        };
      }
    });

    res.json(lastMessagesMap);
  } catch (err) {
    console.error("getLastMessages err", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
