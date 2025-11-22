import express from "express";
import upload from "../config/upload.js";
import { uploadFichier } from "../controllers/cloudinaryController.js";

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFichier);

export default router;
