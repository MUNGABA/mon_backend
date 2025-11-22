const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const adminRoutes = require("./routes/admin")
const candidatureRoutes = require("./routes/candidatureRoutes");
const friendshipRoutes = require("./routes/friendshipRoutes");
const messageRoutes = require("./routes/messageRoutes");
const agentCandidatesRoutes = require("./routes/agentCandidatesRoutes");
const adminCandidatesRoutes = require("./routes/adminCandidatesRoutes");
const messageRoutesPro = require("./routes/messageRoutesPro");
const assignation = require("./routes/assignRoutes")
const fichierRoutes = require("./routes/cloudinaryRoute");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/candidatures", candidatureRoutes);
app.use("/api/friendships", friendshipRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/agent-candidates", agentCandidatesRoutes);
app.use("/api/admin-candidates", adminCandidatesRoutes);
app.use("/api/messages-pro", messageRoutesPro);
app.use("/api/assign", assignation);

app.use("/api/files", fichierRoutes);

module.exports = app;
